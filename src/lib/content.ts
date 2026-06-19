/**
 * Tiny file-based content system for the blog and docs.
 *
 * Markdown files live in `content/<kind>/*.md` with a small front-matter block:
 *
 *   ---
 *   title: My post
 *   description: One-line summary for SEO + listings.
 *   date: 2026-06-01
 *   author: The MOO Chat team
 *   tags: ai, support
 *   order: 1            # docs only — controls sidebar order
 *   ---
 *
 * Everything is read at build time (server components), so there's no runtime
 * cost and pages are statically generated.
 */
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

export type ContentKind = 'blog' | 'docs';

export interface ContentEntry {
  slug: string;
  title: string;
  description: string;
  date?: string;
  author?: string;
  tags: string[];
  order: number;
  readingMinutes: number;
  html: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

/** Parse a very small subset of YAML front-matter (flat `key: value` lines). */
function parseFrontMatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) data[key] = value;
  }
  return { data, body: match[2] };
}

function readEntry(kind: ContentKind, file: string): ContentEntry {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, kind, file), 'utf8');
  const { data, body } = parseFrontMatter(raw);
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug: file.replace(/\.md$/, ''),
    title: data.title || file.replace(/\.md$/, ''),
    description: data.description || '',
    date: data.date,
    author: data.author,
    tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    order: data.order ? Number(data.order) : 999,
    readingMinutes: Math.max(1, Math.round(words / 200)),
    html: marked.parse(body, { async: false }) as string,
  };
}

function listFiles(kind: ContentKind): string[] {
  const dir = path.join(CONTENT_DIR, kind);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

/** All entries of a kind. Blog is sorted newest-first; docs by `order`. */
export function getAllContent(kind: ContentKind): ContentEntry[] {
  const entries = listFiles(kind).map((f) => readEntry(kind, f));
  if (kind === 'blog') {
    return entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  return entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getContentSlugs(kind: ContentKind): string[] {
  return listFiles(kind).map((f) => f.replace(/\.md$/, ''));
}

export function getContent(kind: ContentKind, slug: string): ContentEntry | null {
  const file = `${slug}.md`;
  if (!listFiles(kind).includes(file)) return null;
  return readEntry(kind, file);
}

export function formatDate(date?: string): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
