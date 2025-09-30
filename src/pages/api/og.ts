import type { APIRoute } from 'astro';
import { ImageResponse } from 'workers-og';
import { html as toSatori } from 'satori-html';
import ogImageBase from '~/utils/ogImageBase';

export const GET: APIRoute = async ({ url, locals }) => {
  const searchParams = url.searchParams;
  const title = decodeURIComponent(searchParams.get('title') ?? 'No title');
  const image = decodeURIComponent(searchParams.get('imageUrl') ?? '');

  const titleHtml = `<h1 style="font-size: 60px; line-height: 1.09; color: #6DDA84; font-weight: 900; margin: 0; text-align: left; font-family: 'PPFormula';">${title}</h1>`;
  const html = ogImageBase(titleHtml, image);

  // Load font (TTF/OTF/WOFF only; WOFF2 is not supported by Satori)
  let fontData: ArrayBuffer | undefined;
  try {
    const runtime = locals.runtime;
    if (runtime?.env?.STATIC_ASSETS) {
      const fontRequest = new Request(`${url.origin}/fonts/pp-formula-condensed-black.ttf`);
      const response = await runtime.env.STATIC_ASSETS.fetch(fontRequest);

      if (!response.ok) {
        throw new Error(`Font fetch failed: ${response.status} ${response.statusText}`);
      }

      fontData = await response.arrayBuffer();
    } else {
      // Fallback for development or other environments
      const localFontUrl = `${url.origin}/fonts/pp-formula-condensed-black.ttf`;
      const response = await fetch(localFontUrl);

      if (!response.ok) {
        throw new Error(`Font fetch failed: ${response.status} ${response.statusText}`);
      }

      fontData = await response.arrayBuffer();
    }
  } catch (e) {
    console.error('Failed to load font:', e);
    fontData = undefined;
  }

  const tree = toSatori(html);
  return new ImageResponse(tree, {
    width: 1200,
    height: 630,
    fonts: fontData
      ? [
          {
            name: 'PPFormula',
            data: fontData,
            style: 'normal',
            weight: 900,
          },
        ]
      : [],
  });
};
