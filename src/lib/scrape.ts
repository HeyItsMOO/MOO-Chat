/**
 * Website scraper for auto-setup. Discovers a site's pages (via its sitemap, with
 * a homepage-link fallback), fetches many of them in parallel, and extracts a
 * company name, description, theme color, and an in-depth draft knowledge base —
 * no external dependencies.
 *
 * Best-effort: it never throws on a bad site, it just returns what it can.
 */

import dns from 'node:dns/promises';

export interface SiteInfo {
  ok: boolean;
  companyName: string;
  description: string;
  themeColor: string;
  knowledgeBase: string;
  pagesFetched: string[];
  error?: string;
}

const MAX_PAGES = 18; // pages whose text we pull into the knowledge base
const MAX_CANDIDATES = 120; // URLs we consider before prioritising
const MAX_KB_CHARS = 35000; // overall knowledge-base size cap
const PER_PAGE_CHARS = 2400; // text pulled per page
const FETCH_TIMEOUT = 7000;
const CONCURRENCY = 6; // parallel fetches
const MAX_URL_LEN = 2048;
const MAX_REDIRECTS = 4;

// ── SSRF protection ────────────────────────────────────────────────
// Block requests to loopback / private / link-local / cloud-metadata addresses,
// and re-validate the host on every redirect hop.
// RESIDUAL: there is a narrow DNS-rebinding TOCTOU window — the host is resolved
// here for validation and again by fetch() at connect time. For defence-in-depth
// in production, run on an egress-restricted network that blocks RFC1918 + the
// 169.254.169.254 metadata IP (see DEPLOY.md hardening notes).

function isBlockedIp(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (!lower.includes(':')) {
    const p = lower.split('.').map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = p;
    if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
    if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0) return true; // protocol assignments
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  // IPv6: block the whole ::/96 space (loopback ::1, unspecified ::, v4-mapped
  // ::ffff:a.b.c.d, and deprecated v4-compatible ::a.b.c.d / ::a9fe:a9fe). No
  // legitimate public IPv6 starts with "::", so this is safe and closes the
  // embedded-IPv4 metadata bypass.
  if (lower.startsWith('::')) return true;
  if (lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
  return false;
}

async function hostIsPublic(host: string): Promise<boolean> {
  if (!host) return false;
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false;
  let addrs: { address: string }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    return false;
  }
  if (!addrs.length) return false;
  return addrs.every((a) => !isBlockedIp(a.address));
}

function normalizeUrl(input: string): string | null {
  let u = (input || '').trim();
  if (!u || u.length > MAX_URL_LEN) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Fetch a document (HTML or XML), following redirects manually so the host is
 * re-validated on every hop. Returns the body text or null.
 */
async function fetchDoc(url: string, allowTypes: string[]): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!(await hostIsPublic(u.hostname))) return null;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    let res: Response;
    try {
      res = await fetch(current, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'ChatMOOBot/1.0 (+autosetup)', Accept: 'text/html,application/xhtml+xml,application/xml' },
        redirect: 'manual',
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return null;
      try {
        current = new URL(loc, current).toString();
      } catch {
        return null;
      }
      continue; // re-validate the next hop's host
    }
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!allowTypes.some((t) => ct.includes(t))) return null;
    const text = await res.text();
    return text.slice(0, 600_000);
  }
  return null; // too many redirects
}

const fetchHtml = (url: string) => fetchDoc(url, ['text/html']);
const fetchXml = (url: string) => fetchDoc(url, ['xml', 'text/plain', 'text/html']);

function meta(html: string, name: string): string {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i');
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
  return m ? decodeEntities(m[1]).trim() : '';
}

function titleOf(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : '';
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#0?39;/g, "'")
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&quot;/g, '"');
}

function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCompanyName(raw: string): string {
  return raw.split(/\s[|\-–—:]\s/)[0].trim().slice(0, 80);
}

// Skip asset / binary URLs — we only want readable pages.
const ASSET_RE = /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|mjs|json|pdf|zip|gz|mp4|mov|mp3|wav|woff2?|ttf|eot|xml|rss|txt)(\?|#|$)/i;
// Pages most likely to hold useful business info — fetched first.
const PRIORITY_RE = /(about|service|product|pricing|price|plan|faq|contact|cover|solution|feature|how-it-works|team|company|shop|menu|book|quote|support|help)/i;

function sameHostPageUrls(urls: string[], base: URL): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    try {
      const u = new URL(raw, base);
      if (u.host !== base.host) continue;
      if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
      if (ASSET_RE.test(u.pathname)) continue;
      u.hash = '';
      const s = u.toString();
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
      if (out.length >= MAX_CANDIDATES) break;
    } catch {
      /* skip */
    }
  }
  return out;
}

/** Discover the site's URLs from its sitemap(s); falls back to homepage links. */
async function discoverUrls(base: URL, homeHtml: string): Promise<string[]> {
  const candidates: string[] = [];

  // 1) Sitemaps (covers WordPress's /wp-sitemap.xml and /sitemap_index.xml).
  const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml', '/sitemap-index.xml', '/sitemap1.xml'];
  for (const path of sitemapPaths) {
    const xml = await fetchXml(new URL(path, base).toString());
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
    // A sitemap index points to child sitemaps (more .xml files) — expand a few.
    const childSitemaps = locs.filter((l) => /\.xml(\?|#|$)/i.test(l)).slice(0, 6);
    for (const child of childSitemaps) {
      const cx = await fetchXml(child);
      if (cx) for (const m of cx.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) candidates.push(decodeEntities(m[1]));
      if (candidates.length >= MAX_CANDIDATES) break;
    }
    for (const l of locs) if (!/\.xml(\?|#|$)/i.test(l)) candidates.push(l);
    if (candidates.length) break; // found a usable sitemap
  }

  // 2) Always also include links found on the homepage.
  const hrefs = [...homeHtml.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  candidates.push(...hrefs);

  return sameHostPageUrls(candidates, base);
}

/** Prioritise info-rich pages, prefer shallow paths, cap to MAX_PAGES. */
function prioritise(urls: string[], homeUrl: string): string[] {
  const ranked = urls
    .filter((u) => u !== homeUrl)
    .map((u) => {
      let path = '/';
      try {
        path = new URL(u).pathname;
      } catch {
        /* keep default */
      }
      const depth = path.split('/').filter(Boolean).length;
      const score = (PRIORITY_RE.test(path) ? 0 : 100) + depth; // lower is better
      return { u, score };
    })
    .sort((a, b) => a.score - b.score);
  return ranked.slice(0, MAX_PAGES - 1).map((r) => r.u);
}

/** Run async work over items with a concurrency limit. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function scrapeSite(rawUrl: string): Promise<SiteInfo> {
  const url = normalizeUrl(rawUrl);
  const empty: SiteInfo = { ok: false, companyName: '', description: '', themeColor: '', knowledgeBase: '', pagesFetched: [] };
  if (!url) return { ...empty, error: 'Please enter a valid website URL.' };

  const base = new URL(url);
  const homeHtml = await fetchHtml(url);
  if (!homeHtml) return { ...empty, error: "Couldn't fetch that site. Check the URL is public and try again." };

  const companyName = cleanCompanyName(meta(homeHtml, 'og:site_name') || titleOf(homeHtml) || base.hostname.replace(/^www\./, ''));
  const description = meta(homeHtml, 'description') || meta(homeHtml, 'og:description') || '';
  const themeColor = meta(homeHtml, 'theme-color') || '';

  // Discover the rest of the site and fetch the best pages in parallel.
  const discovered = await discoverUrls(base, homeHtml);
  const toFetch = prioritise(discovered, url);
  const fetched = await mapLimit(toFetch, CONCURRENCY, async (link) => {
    const html = await fetchHtml(link);
    if (!html) return null;
    const body = visibleText(html).slice(0, PER_PAGE_CHARS);
    if (!body || body.length < 80) return null;
    return { link, title: titleOf(html) || link, body };
  });

  const sections: string[] = [];
  sections.push(`# About ${companyName}\n${description || visibleText(homeHtml).slice(0, 1800)}`);
  const pagesFetched = [url];
  for (const page of fetched) {
    if (!page) continue;
    pagesFetched.push(page.link);
    sections.push(`# ${page.title}\n(${page.link})\n${page.body}`);
  }

  let knowledgeBase = sections.join('\n\n').slice(0, MAX_KB_CHARS).trim();
  knowledgeBase +=
    `\n\n# Note\n(Auto-generated from ${pagesFetched.length} page(s) on ${base.hostname}. Review and tidy: remove repeated menus/cookie notices, then add FAQs, hours, and contact details.)`;

  return {
    ok: true,
    companyName,
    description,
    themeColor: /^#[0-9a-fA-F]{6}$/.test(themeColor) ? themeColor : '',
    knowledgeBase,
    pagesFetched,
  };
}
