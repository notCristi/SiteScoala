import type { Locale } from '~/i18n/locales';
import { pick } from '~/i18n/locales';
import type { Media } from '~/server/content';

export interface Variant {
  w: number;
  key: string;
}

/** Resolve a stored key to a public URL. Bundled files start with "/"; R2 keys (img/…, files/…) are served at /<key> by src/pages/img and src/pages/files. */
export const mediaUrl = (key: string) => (key.startsWith('/') || key.startsWith('http') ? key : `/${key}`);

export function imageSources(m: Media) {
  let variants: Variant[] = [];
  try {
    variants = m.variantsJson ? (JSON.parse(m.variantsJson) as Variant[]) : [];
  } catch {
    variants = [];
  }
  variants.sort((a, b) => a.w - b.w);
  const src = mediaUrl(variants.at(-1)?.key ?? m.src ?? '');
  const srcset = variants.length > 1 ? variants.map((v) => `${mediaUrl(v.key)} ${v.w}w`).join(', ') : undefined;
  return { src, srcset, width: m.width ?? 1600, height: m.height ?? 1067 };
}

export function altText(m: Media, locale: Locale) {
  return pick(m as unknown as Record<string, unknown>, 'alt', locale).value;
}
export function caption(m: Media, locale: Locale) {
  return pick(m as unknown as Record<string, unknown>, 'caption', locale).value;
}
