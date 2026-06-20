/**
 * Website scraper for auto-setup. Discovers a site's pages (via its sitemap, with
 * a homepage-link + one-hop crawl fallback), fetches many of them in parallel,
 * and extracts a company name, description, theme color, contact/business details,
 * FAQs, and an in-depth, structure-preserving draft knowledge base — no external
 * dependencies.
 *
 * Best-effort: it never throws on a bad site, it just returns what it can, and it
 * stops cleanly once a wall-clock budget is hit so the request can't hang.
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

const MAX_PAGES = 40; // pages whose text we pull into the knowledge base
const MAX_CANDIDATES = 300; // URLs we consider before prioritising
const MAX_KB_CHARS = 60000; // overall knowledge-base size cap
const PER_PAGE_CHARS = 4500; // text pulled per page
const FETCH_TIMEOUT = 8000;
const CONCURRENCY = 8; // parallel fetches
const MAX_URL_LEN = 2048;
const MAX_REDIRECTS = 4;
const CHILD_SITEMAPS = 25; // child sitemaps expanded from a sitemap index
const TIME_BUDGET_MS = 50000; // overall soft deadline (API maxDuration is 60s)

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
    return text.slice(0, 800_000);
  }
  return null; // too many redirects
}

const fetchHtml = (url: string) => fetchDoc(url, ['text/html']);
const fetchXml = (url: string) => fetchDoc(url, ['xml', 'text/plain', 'text/html']);

type HtmlCache = Map<string, string | null>;
async function fetchHtmlCached(url: string, cache: HtmlCache): Promise<string | null> {
  const hit = cache.get(url);
  if (hit !== undefined) return hit;
  const html = await fetchHtml(url);
  cache.set(url, html);
  return html;
}

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
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&lsquo;|&#8216;/g, '‘')
    .replace(/&ldquo;|&#8220;/g, '“')
    .replace(/&rdquo;|&#8221;/g, '”')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : '';
    });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Convert a page's HTML into clean, structure-preserving text: prefer <main>
 * content, drop site chrome (nav/header/footer/aside/forms/scripts), and keep
 * headings (## …) and list items (- …) so the knowledge base stays readable.
 */
function htmlToText(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|template|iframe|form)\b[\s\S]*?<\/\1>/gi, ' ');

  // Prefer the main content region when the page marks one.
  const mains = [...s.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main>/gi)].map((m) => m[1]);
  if (mains.length) s = mains.join('\n');

  // Drop repeated site chrome that would otherwise pollute every page.
  s = s
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, ' ');

  // Turn block structure into light markdown before stripping tags.
  s = s
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|tr|ul|ol|table|blockquote|dd|dt|figcaption)>/gi, '\n');

  s = decodeEntities(s.replace(/<[^>]+>/g, ' '));

  return s
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[-#\s]+$/gm, '') // drop empty heading/bullet markers
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanCompanyName(raw: string): string {
  return raw.split(/\s[|\-–—:]\s/)[0].trim().slice(0, 80);
}

function unique(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

// ── Structured data (JSON-LD) ──────────────────────────────────────

function parseJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const txt = m[1].trim();
    if (!txt) continue;
    try {
      out.push(JSON.parse(txt));
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return out;
}

/** Flatten JSON-LD (handles arrays and @graph) into a list of nodes. */
function flattenLd(nodes: unknown[]): Record<string, unknown>[] {
  const flat: Record<string, unknown>[] = [];
  const visit = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    const obj = n as Record<string, unknown>;
    if (Array.isArray(obj['@graph'])) (obj['@graph'] as unknown[]).forEach(visit);
    flat.push(obj);
  };
  nodes.forEach(visit);
  return flat;
}

function ldTypes(n: Record<string, unknown>): string[] {
  const t = n['@type'];
  return (Array.isArray(t) ? t : [t]).filter(Boolean).map((x) => String(x).toLowerCase());
}

function formatHours(h: unknown): string {
  if (typeof h === 'string') return h.trim();
  if (h && typeof h === 'object') {
    const o = h as Record<string, unknown>;
    const days = o.dayOfWeek;
    const dayList = (Array.isArray(days) ? days : [days])
      .filter(Boolean)
      .map((d) => String(d).replace(/^https?:\/\/schema\.org\//i, ''));
    const opens = o.opens ? String(o.opens) : '';
    const closes = o.closes ? String(o.closes) : '';
    const when = opens && closes ? `${opens}–${closes}` : opens || closes;
    return [dayList.join(', '), when].filter(Boolean).join(' ').trim();
  }
  return '';
}

/** Pull business/contact details out of Organization/LocalBusiness JSON-LD. */
function businessFromLd(flat: Record<string, unknown>[]): string[] {
  const org = flat.find((n) =>
    ldTypes(n).some((t) => /(organization|localbusiness|store|restaurant|professionalservice|corporation|ngo)/.test(t)),
  );
  if (!org) return [];
  const lines: string[] = [];
  if (org.telephone) lines.push(`- Phone: ${String(org.telephone).trim()}`);
  if (org.email) lines.push(`- Email: ${String(org.email).trim()}`);

  const addr = org.address;
  if (addr && typeof addr === 'object' && !Array.isArray(addr)) {
    const a = addr as Record<string, unknown>;
    const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, a.addressCountry]
      .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>).name : x))
      .filter(Boolean)
      .map(String);
    if (parts.length) lines.push(`- Address: ${parts.join(', ')}`);
  } else if (typeof addr === 'string') {
    lines.push(`- Address: ${addr.trim()}`);
  }

  const hours = org.openingHoursSpecification || org.openingHours;
  if (hours) {
    const list = (Array.isArray(hours) ? hours : [hours]).map(formatHours).filter(Boolean);
    if (list.length) lines.push(`- Hours: ${unique(list).join('; ')}`);
  }
  if (Array.isArray(org.sameAs) && org.sameAs.length) {
    lines.push(`- Social: ${(org.sameAs as unknown[]).map(String).slice(0, 8).join(', ')}`);
  }
  return lines;
}

/** Pull Q&A pairs out of FAQPage / QAPage JSON-LD. */
function faqsFromLd(flat: Record<string, unknown>[]): string[] {
  const out: string[] = [];
  for (const n of flat) {
    const entity = n.mainEntity;
    if (!ldTypes(n).includes('faqpage') && !ldTypes(n).includes('qapage') && !Array.isArray(entity)) continue;
    const items = Array.isArray(entity) ? entity : entity ? [entity] : [];
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const q = raw as Record<string, unknown>;
      const question = String(q.name || q.text || '').trim();
      const answerNode = q.acceptedAnswer || q.suggestedAnswer;
      const answerObj = Array.isArray(answerNode) ? answerNode[0] : answerNode;
      const answer =
        answerObj && typeof answerObj === 'object'
          ? stripTags(String((answerObj as Record<string, unknown>).text || ''))
          : '';
      if (question && answer) out.push(`**Q: ${question}**\n${answer}`);
    }
  }
  return out;
}

/** Phone / email / social links found directly in the markup. */
function contactsFromHtml(html: string): { phones: string[]; emails: string[]; socials: string[] } {
  const phones = unique([...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map((m) => decodeEntities(m[1])));
  const emails = unique(
    [...html.matchAll(/href=["']mailto:([^"'?]+)/gi)].map((m) => decodeEntities(m[1])),
  ).filter((e) => /@/.test(e));
  const socials = unique(
    [
      ...html.matchAll(
        /href=["'](https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|x|linkedin|youtube|tiktok|pinterest)\.com\/[^"'\s>]+)["']/gi,
      ),
    ].map((m) => m[1]),
  ).slice(0, 8);
  return { phones, emails, socials };
}

// Skip asset / binary URLs — we only want readable pages.
const ASSET_RE = /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|mjs|json|pdf|zip|gz|mp4|mov|mp3|wav|woff2?|ttf|eot|xml|rss|txt)(\?|#|$)/i;
// Pages most likely to hold useful business info — fetched first.
const PRIORITY_RE = /(about|service|product|pricing|price|plan|faq|contact|cover|solution|feature|how-it-works|team|company|shop|menu|book|quote|support|help|policy|terms|shipping|return|delivery|warranty)/i;

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

function linksIn(html: string): string[] {
  return [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
}

/** Discover the site's URLs from its sitemap(s); falls back to a homepage-link
 *  crawl, then one extra hop when the site has no sitemap. */
async function discoverUrls(base: URL, homeHtml: string, cache: HtmlCache, deadline: number): Promise<string[]> {
  const candidates: string[] = [];

  // 1) Sitemaps (covers WordPress's /wp-sitemap.xml and /sitemap_index.xml).
  const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml', '/sitemap-index.xml', '/sitemap1.xml'];
  for (const path of sitemapPaths) {
    if (Date.now() > deadline) break;
    const xml = await fetchXml(new URL(path, base).toString());
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
    // A sitemap index points to child sitemaps (more .xml files) — expand many.
    const childSitemaps = locs.filter((l) => /\.xml(\?|#|$)/i.test(l)).slice(0, CHILD_SITEMAPS);
    for (const child of childSitemaps) {
      if (candidates.length >= MAX_CANDIDATES || Date.now() > deadline) break;
      const cx = await fetchXml(child);
      if (cx) for (const m of cx.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) candidates.push(decodeEntities(m[1]));
    }
    for (const l of locs) if (!/\.xml(\?|#|$)/i.test(l)) candidates.push(l);
    if (candidates.length) break; // found a usable sitemap
  }

  // 2) Always also include links found on the homepage.
  candidates.push(...linksIn(homeHtml));
  let pages = sameHostPageUrls(candidates, base);

  // 3) Thin discovery (likely no sitemap) → crawl one hop deeper from the best
  //    homepage links to find more real pages.
  if (pages.length < 25 && Date.now() < deadline) {
    const seeds = prioritise(pages, base.toString()).slice(0, 8);
    const harvested = await mapLimit(seeds, CONCURRENCY, async (link) => {
      if (Date.now() > deadline) return [] as string[];
      const html = await fetchHtmlCached(link, cache);
      return html ? linksIn(html) : [];
    });
    candidates.push(...harvested.flat());
    pages = sameHostPageUrls(candidates, base);
  }

  return pages;
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

/** Drop short lines (menus, cookie notices) repeated across most pages. */
function dedupeBoilerplate(pages: { body: string }[]): void {
  if (pages.length < 4) return;
  const freq = new Map<string, number>();
  for (const p of pages) {
    const seen = new Set<string>();
    for (const line of p.body.split('\n')) {
      const t = line.trim();
      if (t.length < 8 || t.length > 120) continue; // only nav-ish / short lines
      if (seen.has(t)) continue;
      seen.add(t);
      freq.set(t, (freq.get(t) || 0) + 1);
    }
  }
  const threshold = Math.max(4, Math.ceil(pages.length * 0.6));
  const common = new Set([...freq].filter(([, c]) => c >= threshold).map(([t]) => t));
  if (!common.size) return;
  for (const p of pages) {
    p.body = p.body
      .split('\n')
      .filter((l) => !common.has(l.trim()))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export async function scrapeSite(rawUrl: string): Promise<SiteInfo> {
  const deadline = Date.now() + TIME_BUDGET_MS;
  const url = normalizeUrl(rawUrl);
  const empty: SiteInfo = { ok: false, companyName: '', description: '', themeColor: '', knowledgeBase: '', pagesFetched: [] };
  if (!url) return { ...empty, error: 'Please enter a valid website URL.' };

  const cache: HtmlCache = new Map();
  const base = new URL(url);
  const homeHtml = await fetchHtmlCached(url, cache);
  if (!homeHtml) return { ...empty, error: "Couldn't fetch that site. Check the URL is public and try again." };

  const companyName = cleanCompanyName(meta(homeHtml, 'og:site_name') || titleOf(homeHtml) || base.hostname.replace(/^www\./, ''));
  const description = meta(homeHtml, 'description') || meta(homeHtml, 'og:description') || '';
  const themeColor = meta(homeHtml, 'theme-color') || '';

  // Discover the rest of the site and fetch the best pages in parallel.
  const discovered = await discoverUrls(base, homeHtml, cache, deadline);
  const toFetch = prioritise(discovered, url);
  const fetched = await mapLimit(toFetch, CONCURRENCY, async (link) => {
    if (Date.now() > deadline) return null;
    const html = await fetchHtmlCached(link, cache);
    if (!html) return null;
    return { link, title: titleOf(html) || link, body: htmlToText(html).slice(0, PER_PAGE_CHARS), html };
  });
  type Page = { link: string; title: string; body: string; html: string };
  const fetchedOk = fetched.filter((p): p is Page => p !== null);

  // Collect structured data from EVERY page we read (homepage + the rest), even
  // thin pages whose visible text is too short to add as their own section —
  // an otherwise-empty /faq still carries valuable FAQ schema.
  const allHtml = [homeHtml, ...fetchedOk.map((p) => p.html)];
  const ld = flattenLd(allHtml.flatMap((h) => parseJsonLd(h)));
  const businessLines = businessFromLd(ld);
  const faqs = unique(faqsFromLd(ld));

  // Augment business details with phone/email/social links from the markup.
  const contacts = { phones: [] as string[], emails: [] as string[], socials: [] as string[] };
  for (const h of allHtml) {
    const c = contactsFromHtml(h);
    contacts.phones.push(...c.phones);
    contacts.emails.push(...c.emails);
    contacts.socials.push(...c.socials);
  }
  contacts.phones = unique(contacts.phones).slice(0, 4);
  contacts.emails = unique(contacts.emails).slice(0, 4);
  contacts.socials = unique(contacts.socials).slice(0, 8);

  const hasLd = (re: RegExp) => businessLines.some((l) => re.test(l));
  if (!hasLd(/^- Phone:/) && contacts.phones.length) businessLines.push(`- Phone: ${contacts.phones.join(', ')}`);
  if (!hasLd(/^- Email:/) && contacts.emails.length) businessLines.push(`- Email: ${contacts.emails.join(', ')}`);
  if (!hasLd(/^- Social:/) && contacts.socials.length) businessLines.push(`- Social: ${contacts.socials.join(', ')}`);

  // Pages with enough visible text contribute their own section; clean repeated
  // menus / cookie text out of those bodies first.
  const pages = fetchedOk.filter((p) => p.body.length >= 80);
  dedupeBoilerplate(pages);

  // ── Assemble the knowledge base ──────────────────────────────────
  const sections: string[] = [];
  sections.push(`# About ${companyName}\n${description ? description + '\n\n' : ''}${htmlToText(homeHtml).slice(0, 2200)}`);
  if (businessLines.length) sections.push(`# Business details\n${unique(businessLines).join('\n')}`);

  const pagesFetched = unique([url, ...fetchedOk.map((p) => p.link)]);
  for (const page of pages) {
    sections.push(`# ${page.title}\n(${page.link})\n${page.body}`);
  }

  if (faqs.length) sections.push(`# FAQs\n${faqs.slice(0, 40).join('\n\n')}`);

  let knowledgeBase = sections.join('\n\n').slice(0, MAX_KB_CHARS).trim();
  knowledgeBase +=
    `\n\n# Note\n(Auto-generated from ${pagesFetched.length} page(s) on ${base.hostname}. Repeated menus and cookie notices were removed automatically — review for accuracy, then add anything the site doesn't cover, like hours or current promotions.)`;

  return {
    ok: true,
    companyName,
    description,
    themeColor: /^#[0-9a-fA-F]{6}$/.test(themeColor) ? themeColor : '',
    knowledgeBase,
    pagesFetched,
  };
}
