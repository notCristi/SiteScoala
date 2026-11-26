/**
 * Progressive enhancement for /admin. Every form works without this file; it adds:
 * tabs, Markdown toolbar + live preview, pickers, repeaters, drag / ▲▼ ordering, instant filter,
 * confirmations, copy buttons and a toast — each interaction answers in < 100 ms (Doherty).
 */
const ui = (document.body.dataset.ui === 'de' ? 'de' : 'ro') as 'ro' | 'de';
const L = (ro: string, de: string) => (ui === 'de' ? de : ro);
const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf"]')?.content ?? '';

export function toast(msg: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 2600);
}

export async function api<T = unknown>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: body instanceof FormData ? { 'x-csrf': csrf } : { 'x-csrf': csrf, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    credentials: 'same-origin',
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j;
}

// (worker types shadow parts of the DOM `Element` type in this project, hence the loose signatures)
const $$ = <E = HTMLElement>(sel: string, root: unknown = document) => [...(root as Document).querySelectorAll(sel)] as unknown as E[];
const before = (ref: unknown, node: unknown) => (ref as Node).parentNode?.insertBefore(node as Node, ref as Node);
const after = (ref: unknown, node: unknown) => (ref as Node).parentNode?.insertBefore(node as Node, (ref as Node).nextSibling);

// ── mobile menu ──
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu]');
menuBtn?.addEventListener('click', () => {
  const side = document.getElementById('side');
  const open = !side?.classList.contains('is-open');
  side?.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});

// ── focus flash / error summary ──
document.querySelector<HTMLElement>('[data-focus]')?.focus();
$$<HTMLAnchorElement>('[data-goto]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const name = a.dataset.goto!;
    const field = document.getElementById(`f-${name}`) ?? document.querySelector<HTMLElement>(`[name="${name}"]`);
    if (!field) return;
    e.preventDefault();
    const panel = field.closest<HTMLElement>('[role="tabpanel"]');
    if (panel) activateTab(panel.closest('[data-tabs]')!, panel.id);
    const det = field.closest('details');
    if (det) det.open = true;
    field.focus();
  }),
);
// open the first tab that holds an error
const firstInvalid = document.querySelector<HTMLElement>('[role="tabpanel"] [aria-invalid="true"]');
if (firstInvalid) {
  const panel = firstInvalid.closest<HTMLElement>('[role="tabpanel"]')!;
  activateTab(panel.closest('[data-tabs]')!, panel.id);
}

// ── tabs ──
function activateTab(box: Element, panelId: string) {
  $$<HTMLButtonElement>('[role="tab"]', box).forEach((tab) => {
    const on = tab.getAttribute('aria-controls') === panelId;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  });
  $$<HTMLElement>('[role="tabpanel"]', box).forEach((p) => (p.hidden = p.id !== panelId));
}
$$('[data-tabs]').forEach((box) => {
  const tabs = $$<HTMLButtonElement>('[role="tab"]', box);
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(box, tab.getAttribute('aria-controls')!));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length]!;
      next.focus();
      activateTab(box, next.getAttribute('aria-controls')!);
    });
  });
});

// ── Markdown toolbar + preview ──
function wrapSel(ta: HTMLTextAreaElement, before: string, after = before, placeholder = '') {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const sel = value.slice(s, e) || placeholder;
  ta.setRangeText(`${before}${sel}${after}`, s, e, 'end');
  if (!value.slice(s, e)) ta.setSelectionRange(s + before.length, s + before.length + sel.length);
  ta.focus();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
function prefixLines(ta: HTMLTextAreaElement, make: (i: number) => string) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const start = value.lastIndexOf('\n', s - 1) + 1;
  const endIdx = value.indexOf('\n', e);
  const end = endIdx === -1 ? value.length : endIdx;
  const lines = value.slice(start, end).split('\n');
  const out = lines.map((l, i) => make(i) + l.replace(/^(#{1,3} |[-*] |\d+\. )/, '')).join('\n');
  ta.setRangeText(out, start, end, 'end');
  ta.focus();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
$$('[data-md]').forEach((box) => {
  const ta = box.querySelector<HTMLTextAreaElement>('textarea')!;
  const out = box.querySelector<HTMLElement>('[data-preview-out]')!;
  const prose = out.querySelector<HTMLElement>('.prose')!;
  const btnPrev = box.querySelector<HTMLButtonElement>('[data-preview]')!;
  let timer = 0;
  let seq = 0;
  const render = async () => {
    const my = ++seq;
    if (!ta.value.trim()) {
      prose.innerHTML = `<p><em>${L('Nimic de previzualizat încă.', 'Noch nichts für die Vorschau.')}</em></p>`;
      return;
    }
    try {
      const { html } = await api<{ html: string }>('/api/admin/preview', { md: ta.value });
      if (my === seq) prose.innerHTML = html; // sanitised server-side by renderMarkdown
    } catch {
      /* offline: keep last preview */
    }
  };
  btnPrev.addEventListener('click', () => {
    const open = out.hidden;
    out.hidden = !open;
    btnPrev.setAttribute('aria-expanded', String(open));
    if (open) void render();
  });
  ta.addEventListener('input', () => {
    if (out.hidden) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void render(), 250);
  });
  $$<HTMLButtonElement>('[data-fmt]', box).forEach((b) =>
    b.addEventListener('click', () => {
      const f = b.dataset.fmt;
      if (f === 'bold') wrapSel(ta, '**', '**', L('text', 'Text'));
      else if (f === 'italic') wrapSel(ta, '_', '_', L('text', 'Text'));
      else if (f === 'heading') prefixLines(ta, () => '## ');
      else if (f === 'list') prefixLines(ta, () => '- ');
      else if (f === 'olist') prefixLines(ta, (i) => `${i + 1}. `);
      else if (f === 'link') {
        const href = window.prompt(b.dataset.prompt ?? 'https://', 'https://');
        if (!href || !/^(https?:\/\/|\/|mailto:|tel:)/.test(href)) return;
        wrapSel(ta, '[', `](${href})`, L('textul linkului', 'Linktext'));
      }
    }),
  );
  ta.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === 'b') { e.preventDefault(); wrapSel(ta, '**', '**', 'text'); }
    if (e.key === 'i') { e.preventDefault(); wrapSel(ta, '_', '_', 'text'); }
  });
});

// ── slug preview from the Romanian title ──
const TR: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', ș: 's', ş: 's', ț: 't', ţ: 't', ă: 'a', â: 'a', î: 'i' };
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[äöüßșşțţăâî]/g, (c) => TR[c] ?? c)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
const slugInput = document.querySelector<HTMLInputElement>('[data-slug]');
const titleRo = document.querySelector<HTMLInputElement>('input[name="titleRo"], input[name="nameRo"]');
if (slugInput && titleRo) {
  const sync = () => (slugInput.placeholder = slugify(titleRo.value));
  titleRo.addEventListener('input', sync);
  sync();
}

// ── banner defaults: end date +3 days when switched on ──
const bannerBox = document.querySelector('[data-banner]');
const bannerOn = bannerBox?.querySelector<HTMLInputElement>('input[name="pinnedBanner"]');
const bannerUntil = bannerBox?.querySelector<HTMLInputElement>('input[name="bannerUntil"]');
bannerOn?.addEventListener('change', () => {
  if (bannerOn.checked && bannerUntil && !bannerUntil.value) {
    const d = new Date(Date.now() + 3 * 86400_000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    bannerUntil.value = d.toISOString().slice(0, 16);
  }
});

// ── document file → title from file name ──
document.querySelector<HTMLInputElement>('[data-docfile]')?.addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  const title = document.querySelector<HTMLInputElement>('input[name="titleRo"]');
  if (f && title && !title.value)
    title.value = f.name
      .replace(/\.[a-z0-9]{1,5}$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
});

// ── confirmations ──
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('[data-confirm]');
  if (b && !window.confirm(b.dataset.confirm!)) e.preventDefault();
});

// ── auto-submit filters ──
$$<HTMLSelectElement>('select[data-autosubmit]').forEach((s) => s.addEventListener('change', () => s.form?.requestSubmit()));
$$<HTMLInputElement>('input[data-autosubmit-check]').forEach((i) => i.addEventListener('change', () => i.form?.requestSubmit()));

// ── instant table filter (client-side, while the server search is one Enter away) ──
$$<HTMLInputElement>('[data-filter-table]').forEach((inp) => {
  const table = document.querySelector(inp.dataset.filterTable!);
  if (!table) return;
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    $$<HTMLTableRowElement>('tbody tr', table).forEach((tr) => (tr.hidden = !!q && !tr.textContent!.toLowerCase().includes(q)));
  });
});

// ── copy buttons ──
$$<HTMLButtonElement>('[data-copy]').forEach((b) =>
  b.addEventListener('click', async () => {
    const inp = document.querySelector<HTMLInputElement>(b.dataset.copy!);
    if (!inp) return;
    inp.select();
    try {
      await navigator.clipboard.writeText(inp.value);
    } catch {
      /* clipboard unavailable: the text stays selected for Ctrl+C */
    }
    toast(L('Copiat', 'Kopiert'));
  }),
);

// ── repeaters ──
$$('[data-repeater]').forEach((box) => {
  const prefix = box.dataset.repeater!;
  const rowsEl = box.querySelector<HTMLElement>('[data-rows]')!;
  const first = rowsEl.querySelector<HTMLElement>('[data-row]');
  const tpl = first?.cloneNode(true) as HTMLElement | undefined;
  if (tpl) $$<HTMLInputElement>('input, textarea, select', tpl).forEach((i) => (i.value = ''));
  const re = new RegExp(`^${prefix}\\[\\d+\\]`);
  const renumber = () =>
    $$<HTMLElement>('[data-row]', rowsEl).forEach((row, k) => {
      row.querySelector('[data-num]')!.textContent = String(k + 1);
      row.querySelectorAll<HTMLInputElement>('[name]').forEach((i) => {
        i.name = i.name.replace(re, `${prefix}[${k}]`);
        i.id = i.id.replace(new RegExp(`^${prefix}-\\d+-`), `${prefix}-${k}-`);
      });
      row.querySelectorAll<HTMLLabelElement>('label[for]').forEach((l) => (l.htmlFor = l.htmlFor.replace(new RegExp(`^${prefix}-\\d+-`), `${prefix}-${k}-`)));
    });
  box.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const row = t.closest<HTMLElement>('[data-row]');
    if (t.closest('[data-add]') && tpl) {
      const n = tpl.cloneNode(true) as HTMLElement;
      rowsEl.appendChild(n);
      renumber();
      n.querySelector<HTMLElement>('input, textarea')?.focus();
    } else if (row && t.closest('[data-remove]')) {
      row.remove();
      renumber();
    } else if (row && t.closest('[data-up]') && row.previousElementSibling) {
      before(row.previousElementSibling, row);
      renumber();
      t.closest<HTMLElement>('button')?.focus();
    } else if (row && t.closest('[data-down]') && row.nextElementSibling) {
      after(row.nextElementSibling, row);
      renumber();
      t.closest<HTMLElement>('button')?.focus();
    }
  });
});

// ── table ordering: drag handle or ▲▼, then "Salvează ordinea" ──
$$<HTMLTableElement>('table[data-reorder]').forEach((table) => {
  const entity = table.dataset.reorder!;
  const tbody = table.tBodies[0]!;
  const scope = table.closest('section, main') ?? document;
  const save = scope.querySelector<HTMLButtonElement>('[data-save-order]');
  const changed = () => {
    if (save) save.hidden = false;
    $$('[data-num]', tbody).forEach((n, i) => (n.textContent = String(i + 1)));
  };
  tbody.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tr = t.closest('tr');
    if (!tr) return;
    if (t.closest('[data-up]') && tr.previousElementSibling) { before(tr.previousElementSibling, tr); changed(); t.closest<HTMLElement>('button')?.focus(); }
    if (t.closest('[data-down]') && tr.nextElementSibling) { after(tr.nextElementSibling, tr); changed(); t.closest<HTMLElement>('button')?.focus(); }
  });
  let dragging: HTMLTableRowElement | null = null;
  tbody.addEventListener('dragstart', (e) => {
    const h = (e.target as HTMLElement).closest('[data-handle]');
    if (!h) return;
    dragging = h.closest('tr');
    dragging?.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', '');
  });
  tbody.addEventListener('dragover', (e) => {
    if (!dragging) return;
    e.preventDefault();
    const over = (e.target as HTMLElement).closest('tr');
    if (!over || over === dragging) return;
    const r = over.getBoundingClientRect();
    if (e.clientY > r.top + r.height / 2) after(over, dragging);
    else before(over, dragging);
  });
  tbody.addEventListener('dragend', () => {
    dragging?.classList.remove('dragging');
    dragging = null;
    changed();
  });
  save?.addEventListener('click', async () => {
    const ids = [...tbody.rows].map((r) => r.dataset.id);
    save.disabled = true;
    try {
      const galleryId = table.closest<HTMLElement>('[data-gallery]')?.dataset.gallery;
      await api('/api/admin/reorder', { entity, ids, galleryId });
      save.hidden = true;
      toast(L('Ordinea a fost salvată.', 'Die Reihenfolge wurde gespeichert.'));
    } catch (err) {
      toast(String(err));
    } finally {
      save.disabled = false;
    }
  });
});

// ── pickers (media + documents), one shared dialog ──
interface MediaItem {
  id: string;
  thumb: string;
  alt: string;
}
interface DocItem {
  id: number;
  title: string;
  category: string;
  year: string | null;
  ext: string | null;
  status: string;
}
let dlg: HTMLDialogElement | null = null;
function dialog(title: string) {
  dlg?.remove();
  dlg = document.createElement('dialog');
  dlg.className = 'pick';
  dlg.innerHTML = `<header><strong></strong><input type="search" aria-label="${L('Caută', 'Suchen')}" placeholder="${L('Caută…', 'Suchen …')}"><button type="button" class="btn btn--sm" data-close>${L('Închide', 'Schließen')}</button></header><div data-body></div>`;
  dlg.querySelector('strong')!.textContent = title;
  dlg.querySelector('[data-close]')!.addEventListener('click', () => dlg?.close());
  document.body.appendChild(dlg);
  dlg.showModal();
  return dlg;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function pickMedia(onPick: (m: MediaItem[]) => void, multiple = false) {
  const d = dialog(multiple ? L('Alegeți imaginile', 'Bilder auswählen') : L('Alegeți imaginea', 'Bild auswählen'));
  const body = d.querySelector<HTMLElement>('[data-body]')!;
  const search = d.querySelector<HTMLInputElement>('input')!;
  const chosen = new Map<string, MediaItem>();
  let items: MediaItem[] = [];
  const draw = () => {
    body.innerHTML = items.length
      ? `<div class="pick-grid">${items
          .map(
            (m) =>
              `<button type="button" data-id="${esc(m.id)}" aria-pressed="${chosen.has(m.id)}"><img src="${esc(m.thumb)}" alt="" loading="lazy" width="160" height="107"><span>${esc(m.alt || '—')}</span></button>`,
          )
          .join('')}</div>${multiple ? `<p style="padding:0 1rem 1rem"><button type="button" class="btn btn--primary" data-done>${L('Adaugă selecția', 'Auswahl hinzufügen')}</button></p>` : ''}`
      : `<p class="empty">${L('Nicio imagine. Încărcați imagini din „Imagini & video”.', 'Keine Bilder. Laden Sie Bilder unter „Bilder & Video“ hoch.')}</p>`;
  };
  const load = async () => {
    items = (await api<{ items: MediaItem[] }>(`/api/admin/media/list?q=${encodeURIComponent(search.value)}`)).items;
    draw();
  };
  let t = 0;
  search.addEventListener('input', () => (window.clearTimeout(t), (t = window.setTimeout(() => void load(), 200))));
  body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-done]')) {
      onPick([...chosen.values()]);
      d.close();
      return;
    }
    const b = target.closest<HTMLButtonElement>('button[data-id]');
    if (!b) return;
    const m = items.find((x) => x.id === b.dataset.id)!;
    if (!multiple) {
      onPick([m]);
      d.close();
      return;
    }
    if (chosen.has(m.id)) chosen.delete(m.id);
    else chosen.set(m.id, m);
    b.setAttribute('aria-pressed', String(chosen.has(m.id)));
    b.style.outline = chosen.has(m.id) ? '3px solid var(--lapis)' : '';
  });
  void load();
}

function pickDoc(onPick: (d: DocItem) => void) {
  const d = dialog(L('Alegeți documentul', 'Dokument auswählen'));
  const body = d.querySelector<HTMLElement>('[data-body]')!;
  const search = d.querySelector<HTMLInputElement>('input')!;
  let items: DocItem[] = [];
  const load = async () => {
    items = (await api<{ items: DocItem[] }>(`/api/admin/documents/list?q=${encodeURIComponent(search.value)}`)).items;
    body.innerHTML = `<div class="pick-list">${items
      .map((x) => `<button type="button" data-id="${x.id}">${esc(x.title)}<small>${esc([x.category, x.year, x.ext?.toUpperCase(), x.status].filter(Boolean).join(' · '))}</small></button>`)
      .join('')}</div>`;
  };
  let t = 0;
  search.addEventListener('input', () => (window.clearTimeout(t), (t = window.setTimeout(() => void load(), 200))));
  body.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-id]');
    if (!b) return;
    onPick(items.find((x) => String(x.id) === b.dataset.id)!);
    d.close();
  });
  void load();
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const mp = t.closest<HTMLElement>('[data-mediapicker]');
  if (mp && t.closest('[data-pick-media]')) {
    pickMedia(([m]) => {
      if (!m) return;
      mp.querySelector<HTMLInputElement>('[data-value]')!.value = m.id;
      const img = mp.querySelector<HTMLImageElement>('[data-thumb]')!;
      img.src = m.thumb;
      img.alt = m.alt;
      img.hidden = false;
      mp.querySelector('[data-alt]')!.textContent = m.alt;
      markDirty();
    });
  } else if (mp && t.closest('[data-clear]')) {
    mp.querySelector<HTMLInputElement>('[data-value]')!.value = '';
    mp.querySelector<HTMLImageElement>('[data-thumb]')!.hidden = true;
    mp.querySelector('[data-alt]')!.textContent = '—';
    markDirty();
  }
  const dp = t.closest<HTMLElement>('[data-docpicker]');
  if (dp && t.closest('[data-pick-doc]')) {
    pickDoc((d) => {
      dp.querySelector<HTMLInputElement>('[data-value]')!.value = String(d.id);
      dp.querySelector('[data-name]')!.textContent = d.title;
      markDirty();
    });
  } else if (dp && t.closest('[data-clear]')) {
    dp.querySelector<HTMLInputElement>('[data-value]')!.value = '';
    dp.querySelector('[data-name]')!.textContent = '—';
    markDirty();
  }
  // gallery items
  const gal = t.closest<HTMLElement>('[data-gallery]');
  if (gal && t.closest('[data-gallery-add]')) {
    pickMedia(async (ms) => {
      if (!ms.length) return;
      await api('/api/admin/gallery', { galleryId: gal.dataset.gallery, add: ms.map((m) => m.id) });
      location.reload();
    }, true);
  }
  const rm = t.closest<HTMLElement>('[data-gallery-remove]');
  if (gal && rm) {
    void api('/api/admin/gallery', { galleryId: gal.dataset.gallery, remove: rm.dataset.galleryRemove }).then(() => rm.closest('tr')?.remove());
  }
});

// ── unsaved-changes guard ──
let dirty = false;
function markDirty() {
  dirty = true;
}
const guarded = document.querySelector<HTMLFormElement>('form[data-dirty-guard]');
if (guarded) {
  guarded.addEventListener('input', markDirty);
  guarded.addEventListener('submit', () => (dirty = false));
  window.addEventListener('beforeunload', (e) => {
    if (dirty) e.preventDefault();
  });
}
