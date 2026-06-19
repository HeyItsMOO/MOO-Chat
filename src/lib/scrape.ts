/**
 * Lightweight website scraper for auto-setup. Fetches a site's homepage (and a
 * few key linked pages), then extracts a company name, description, theme color,
 * and a draft knowledge base — no external dependencies.
 *
 * This is best-effort: it never throws on a bad site, it just returns what it can.
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

const MAX_PAGES = 4;
const MAX_KB_CHARS = 12000;
const FETCH_TIMEOUT = 8000;
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

async function fetchHtml(url: string): Promise<string | null> {
  let current = url;
  // Follow redirects MANUALLY so we can re-validate the host on every hop
  // (a public URL could 30x-redirect to an internal/metadata address).
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
        headers: { 'User-Agent': 'MOOChatBot/1.0 (+autosetup)', Accept: 'text/html' },
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
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    const text = await res.text();
    return text.slice(0, 400_000);
  }
  return null; // too many redirects
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
  // "Acme Co — Best widgets in town" → "Acme Co"
  return raw.split(/\s[|\-–—:]\s/)[0].trim().slice(0, 80);
}

function internalLinks(html: string, base: URL): string[] {
  const out: string[] = [];
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  const wanted = /(about|service|product|faq|pricing|contact|cover|solution)/i;
  while ((m = re.exec(html)) && out.length < 12) {
    try {
      const href = new URL(m[1], base);
      if (href.host !== base.host) continue;
      if (href.hash) href.hash = '';
      const s = href.toString();
      if (s === base.toString()) continue;
      if (wanted.test(href.pathname) && !out.includes(s)) out.push(s);
    } catch {
      /* skip */
    }
  }
  return out.slice(0, MAX_PAGES - 1);
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

  const sections: string[] = [];
  sections.push(`# About ${companyName}\n${description || visibleText(homeHtml).slice(0, 1500)}`);

  const links = internalLinks(homeHtml, base);
  const pagesFetched = [url];
  for (const link of links) {
    const html = await fetchHtml(link);
    if (!html) continue;
    pagesFetched.push(link);
    const t = titleOf(html) || link;
    const body = visibleText(html).slice(0, 2500);
    if (body) sections.push(`# ${t}\n(${link})\n${body}`);
  }

  let knowledgeBase = sections.join('\n\n').slice(0, MAX_KB_CHARS).trim();
  knowledgeBase +=
    '\n\n# Note\n(This knowledge base was auto-generated from the website — review and tidy it: remove menus/cookie notices, add FAQs, hours, and contact details.)';

  return {
    ok: true,
    companyName,
    description,
    themeColor: /^#[0-9a-fA-F]{6}$/.test(themeColor) ? themeColor : '',
    knowledgeBase,
    pagesFetched,
  };
}
