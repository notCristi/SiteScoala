/**
 * Markdown → safe HTML, run at SAVE time in /admin (never on public renders).
 * Raw HTML is escaped, links are restricted to http(s)/mailto/tel/relative,
 * images only from our own origin paths. Staff cannot break the layout.
 */
import { Marked, type Tokens } from 'marked';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SAFE_HREF = /^(https?:\/\/[^/\\]|mailto:|tel:|\/(?![/\\])|#)/i;

const md = new Marked({
  gfm: true,
  breaks: true,
  async: false,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return esc(token.text);
    },
    link(token: Tokens.Link) {
      const href = token.href.trim();
      const text = this.parser.parseInline(token.tokens);
      if (!SAFE_HREF.test(href)) return text;
      const external = /^https?:\/\//i.test(href);
      // file downloads are never hover-prefetched (Astro prefetchAll)
      const file = /^\/files\//.test(href);
      return `<a href="${esc(href)}"${external ? ' rel="noopener" target="_blank"' : ''}${file ? ' data-astro-prefetch="false"' : ''}>${text}</a>`;
    },
    image(token: Tokens.Image) {
      const src = token.href.trim();
      if (!/^\/(media|files)\//.test(src)) return esc(token.text);
      return `<img src="${esc(src)}" alt="${esc(token.text)}" loading="lazy" decoding="async">`;
    },
    heading(token: Tokens.Heading) {
      // h1 belongs to the page: "#" and "##" both become h2; never below h4.
      const level = Math.min(4, Math.max(2, token.depth));
      return `<h${level}>${this.parser.parseInline(token.tokens)}</h${level}>`;
    },
    table(token: Tokens.Table) {
      const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
      const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
      // A focusable, named scroll region: wide tables scroll inside the column instead of widening the page (WCAG 1.4.10).
      const name = token.header
        .map((c) => plainText(c.text, 60))
        .filter(Boolean)
        .join(' · ');
      return `<div class="table-scroll" role="region" tabindex="0" aria-label="${esc(name || 'Tabel')}"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
    },
  },
});

/** Codes such as 2022-1-RO01-KA120-SCH-000105343: letters and digits in ≥ 3 hyphenated parts. */
const CODE = /\b(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9]+(?:-[A-Z0-9]+){2,}\b/g;
/** Wrap identifiers in <span class="code"> (lining figures) — only in text, never inside tags. */
function markCodes(html: string): string {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : part.replace(CODE, (m) => (m.length >= 8 ? `<span class="code">${m}</span>` : m))))
    .join('');
}

export function renderMarkdown(src: string | null | undefined): string | null {
  if (!src || !src.trim()) return null;
  return markCodes(md.parse(src.slice(0, 200_000)) as string);
}

/** Strip markdown/HTML to plain text (search index, meta descriptions). */
export function plainText(src: string | null | undefined, max = 400): string {
  if (!src) return '';
  const s = src
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]+/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > max ? `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : s;
}
