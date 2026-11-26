/**
 * Browser-side image pipeline (Workers have no image library):
 * decode → resize with <canvas> to WebP at 640 / 1024 / 1600 px (never upscaled) → dominant colour
 * → upload original + variants with progress. Re-encoding drops EXIF/GPS from everything served.
 */
const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf"]')?.content ?? '';
const ui = document.body.dataset.ui === 'de' ? 'de' : 'ro';
const L = (ro: string, de: string) => (ui === 'de' ? de : ro);
const WIDTHS = [640, 1024, 1600];
const MAX = 15 * 1024 * 1024;

interface Prepared {
  width: number;
  height: number;
  placeholder: string;
  variants: { w: number; blob: Blob }[];
}

async function prepare(file: File): Promise<Prepared> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = bmp;
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, 1600)])].sort((a, b) => a - b);
  const variants: { w: number; blob: Blob }[] = [];
  for (const w of widths) {
    const h = Math.max(1, Math.round((height * w) / width));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/webp', 0.82));
    if (!blob || blob.type !== 'image/webp') throw new Error(L('Browserul nu poate crea imagini WebP. Folosiți Chrome, Edge sau Firefox.', 'Der Browser kann kein WebP erzeugen. Bitte Chrome, Edge oder Firefox verwenden.'));
    variants.push({ w, blob });
  }
  // dominant colour: average of an 8×8 downscale
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, 8, 8);
  const px = ctx.getImageData(0, 0, 8, 8).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < px.length; i += 4) {
    r += px[i]!;
    g += px[i + 1]!;
    b += px[i + 2]!;
  }
  const n = px.length / 4;
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0');
  bmp.close();
  return { width, height, placeholder: `#${hex(r)}${hex(g)}${hex(b)}`, variants };
}

function send(fd: FormData, onProgress: (p: number) => void): Promise<{ id: string; duplicate?: boolean }> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', '/api/admin/media/upload');
    x.setRequestHeader('x-csrf', csrf);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => {
      let j: { id?: string; error?: string; duplicate?: boolean } = {};
      try {
        j = JSON.parse(x.responseText) as typeof j;
      } catch {
        /* ignore */
      }
      if (x.status >= 200 && x.status < 300 && j.id) resolve({ id: j.id, duplicate: !!j.duplicate });
      else reject(new Error(j.error ?? `HTTP ${x.status}`));
    };
    x.onerror = () => reject(new Error('network'));
    x.send(fd);
  });
}

export async function uploadImage(file: File, fields: Record<string, string>, onState: (msg: string, p?: number) => void) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(L('Doar JPG, PNG sau WebP. Pentru HEIC: exportați ca JPG.', 'Nur JPG, PNG oder WebP. HEIC bitte als JPG exportieren.'));
  if (file.size > MAX) throw new Error(L('Imaginea depășește 15 MB.', 'Das Bild ist größer als 15 MB.'));
  onState(L('Se pregătește…', 'Wird vorbereitet …'));
  const p = await prepare(file);
  const fd = new FormData();
  fd.append('orig', file, file.name);
  for (const v of p.variants) fd.append(`variant_${v.w}`, v.blob, `${v.w}.webp`);
  fd.append('width', String(p.width));
  fd.append('height', String(p.height));
  fd.append('placeholder', p.placeholder);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  onState(L('Se încarcă…', 'Wird hochgeladen …'), 0);
  return send(fd, (x) => onState(L('Se încarcă…', 'Wird hochgeladen …'), x));
}

// ── library page: multi-file uploader ──
const picker = document.querySelector<HTMLInputElement>('[data-upload-input]');
const list = document.querySelector<HTMLElement>('[data-upload-list]');
const tpl = document.querySelector<HTMLTemplateElement>('#upl-tpl');
const goBtn = document.querySelector<HTMLButtonElement>('[data-upload-go]');
const queue: { file: File; el: HTMLElement }[] = [];
picker?.addEventListener('change', () => {
  for (const file of picker.files ?? []) {
    const el = tpl!.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const img = el.querySelector('img')!;
    img.src = URL.createObjectURL(file);
    el.querySelector('[data-name]')!.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
    const k = queue.length;
    el.querySelectorAll<HTMLInputElement>('[id]').forEach((i) => (i.id = `${i.id}-${k}`));
    el.querySelectorAll<HTMLLabelElement>('label[for]').forEach((l) => (l.htmlFor = `${l.htmlFor}-${k}`));
    el.querySelector('[data-remove]')?.addEventListener('click', () => {
      el.remove();
      const i = queue.findIndex((q) => q.el === el);
      if (i >= 0) queue.splice(i, 1);
      if (goBtn) goBtn.hidden = queue.length === 0;
    });
    list!.appendChild(el);
    queue.push({ file, el });
  }
  picker.value = '';
  if (goBtn) goBtn.hidden = queue.length === 0;
  queue[0]?.el.querySelector<HTMLInputElement>('input[name="altRo"]')?.focus();
});
goBtn?.addEventListener('click', async () => {
  // alt text is required before anything is sent
  for (const q of queue) {
    const alt = q.el.querySelector<HTMLInputElement>('input[name="altRo"]')!;
    if (!alt.value.trim()) {
      alt.setAttribute('aria-invalid', 'true');
      alt.focus();
      q.el.querySelector<HTMLElement>('[data-alt-err]')!.hidden = false;
      return;
    }
  }
  goBtn.disabled = true;
  let ok = 0;
  for (const q of [...queue]) {
    const state = q.el.querySelector<HTMLElement>('[data-state]')!;
    const bar = q.el.querySelector<HTMLProgressElement>('progress')!;
    const fields: Record<string, string> = {};
    q.el.querySelectorAll<HTMLInputElement>('input[name]').forEach((i) => (fields[i.name] = i.value.trim()));
    try {
      const r = await uploadImage(q.file, fields, (msg, p) => {
        state.textContent = msg;
        bar.hidden = p === undefined;
        if (p !== undefined) bar.value = p;
      });
      state.innerHTML = `${r.duplicate ? L('Există deja în bibliotecă', 'Bereits in der Bibliothek') : L('Gata', 'Fertig')} — <a href="/admin/media/${r.id}">${L('deschide', 'öffnen')}</a>`;
      bar.hidden = true;
      queue.splice(queue.indexOf(q), 1);
      ok++;
    } catch (e) {
      state.textContent = `${L('Eroare', 'Fehler')}: ${e instanceof Error ? e.message : String(e)}`;
      state.style.color = 'var(--rubric)';
    }
  }
  goBtn.disabled = false;
  goBtn.hidden = queue.length === 0;
  if (ok && !queue.length) window.setTimeout(() => location.assign('/admin/media?ok=okCreated'), 900);
});

// ── single-image page: replace + focal point ──
const replace = document.querySelector<HTMLInputElement>('[data-replace]');
replace?.addEventListener('change', async () => {
  const file = replace.files?.[0];
  if (!file) return;
  const out = document.querySelector<HTMLElement>('[data-replace-state]')!;
  try {
    await uploadImage(file, { replaceId: replace.dataset.replace! }, (msg, p) => (out.textContent = p === undefined ? msg : `${msg} ${Math.round(p * 100)} %`));
    location.assign(`${location.pathname}?ok=okSaved`);
  } catch (e) {
    out.textContent = `${L('Eroare', 'Fehler')}: ${e instanceof Error ? e.message : String(e)}`;
  }
});
const focal = document.querySelector<HTMLElement>('[data-focal]');
if (focal) {
  const dot = focal.querySelector<HTMLElement>('.dot')!;
  const fx = document.querySelector<HTMLInputElement>('input[name="focalX"]')!;
  const fy = document.querySelector<HTMLInputElement>('input[name="focalY"]')!;
  const place = () => {
    dot.style.left = `${Number(fx.value) * 100}%`;
    dot.style.top = `${Number(fy.value) * 100}%`;
  };
  place();
  focal.addEventListener('click', (e) => {
    const r = focal.getBoundingClientRect();
    fx.value = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)).toFixed(3);
    fy.value = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)).toFixed(3);
    place();
  });
  focal.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    fx.value = Math.min(1, Math.max(0, Number(fx.value) + d[0]!)).toFixed(3);
    fy.value = Math.min(1, Math.max(0, Number(fy.value) + d[1]!)).toFixed(3);
    place();
  });
}
