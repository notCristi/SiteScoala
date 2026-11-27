/**
 * Legacy/API endpoint for the contact form. The page form posts to the contact page itself
 * (src/pages/[lang]/[...path].astro), which can re-render the user's text on errors; this endpoint
 * stays for clients that post here and answers with redirects.
 */
import type { APIRoute } from 'astro';
import { url } from '~/i18n/routes';
import { handleContact, isFormRequest } from '~/server/contact';

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!isFormRequest(request)) {
    return new Response('Unsupported Media Type: send application/x-www-form-urlencoded or multipart/form-data.', {
      status: 415,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const r = await handleContact(request);
  return redirect(`${url('contact', r.locale)}?${r.ok ? 'trimis=1' : `eroare=${r.error}`}#formular`, 303);
};
