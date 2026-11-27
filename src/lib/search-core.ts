/** Shared by the server (no-JS search page) and the ⌘K dialog. */
export type SearchKind = 'page' | 'guide' | 'document' | 'person' | 'news';
export interface SearchRecord {
  k: SearchKind;
  t: string; // title
  s?: string; // subtitle
  u: string; // url
  w?: string; // extra keywords
  x?: 1; // external (file / platform)
}

export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase();

const isWordChar = (c: string | undefined) => !!c && /[a-z0-9]/.test(c);

/**
 * Position of `term` in `hay` at the start of a word ("emp" must not find "temporar"); terms of 6+
 * letters may also match inside a word (German compounds: "prufung" in "aufnahmeprufung"). -1 if absent.
 */
function findTerm(hay: string, term: string): { i: number; start: boolean } {
  let inner = -1;
  for (let i = hay.indexOf(term); i >= 0; i = hay.indexOf(term, i + 1)) {
    if (!isWordChar(hay[i - 1])) return { i, start: true };
    if (inner < 0) inner = i;
  }
  return term.length >= 6 && inner >= 0 ? { i: inner, start: false } : { i: -1, start: false };
}

export function searchRecords(records: SearchRecord[], query: string, limit = 40) {
  const fq = fold(query).trim().replace(/\s+/g, ' ');
  const terms = fq.split(' ').filter((x) => x.length > 0);
  if (!terms.length || fq.length < 2) return [];
  const out: { r: SearchRecord; score: number }[] = [];
  for (const r of records) {
    const title = fold(r.t);
    const hay = `${title} ${fold(r.s ?? '')} ${fold(r.w ?? '')}`;
    let score = 0;
    let ok = true;
    for (const term of terms) {
      const h = findTerm(hay, term);
      if (h.i < 0) {
        ok = false;
        break;
      }
      const ti = findTerm(title, term);
      score += ti.i === 0 ? 12 : ti.i > 0 && ti.start ? 8 : ti.i > 0 ? 5 : h.start ? 3 : 1;
    }
    if (!ok) continue;
    // the title is the query (or starts with it): that record wins over pages that merely mention it
    if (title === fq) score += 40;
    else if (title.startsWith(fq)) score += 15;
    if (r.k === 'guide' || r.k === 'page') score += 2;
    // newer documents first among equals (school year in the subtitle)
    const yr = r.k === 'document' ? /\b(20\d\d)\b/.exec(r.s ?? '') : null;
    if (yr) score += (Number(yr[1]) - 2010) * 0.08;
    score -= r.t.length / 200;
    out.push({ r, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.r);
}
