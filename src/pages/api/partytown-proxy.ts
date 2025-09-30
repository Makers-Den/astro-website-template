import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, request }) => {
  const targetParam = url.searchParams.get('url');
  if (!targetParam) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(targetParam);
  } catch {
    return new Response('Invalid url parameter', { status: 400 });
  }

  // Avoid proxy loops back to ourselves
  if (target.origin === url.origin) {
    return new Response('Refusing to proxy same-origin', { status: 400 });
  }

  // Build upstream request headers and force identity encoding to avoid double-decoding issues
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('accept-encoding', 'identity');
  upstreamHeaders.delete('host');
  upstreamHeaders.delete('connection');

  const fetchInit: RequestInit = {
    method: 'GET',
    headers: upstreamHeaders,
  };

  try {
    const upstreamResp = await fetch(target.toString(), fetchInit);

    // Clone and sanitize headers
    const respHeaders = new Headers(upstreamResp.headers);

    respHeaders.delete('content-encoding');
    respHeaders.delete('content-length');
    respHeaders.delete('transfer-encoding');

    if (upstreamResp.ok) {
      // Favor upstream cache control if present
      if (!respHeaders.get('cache-control')) {
        respHeaders.set('cache-control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
      }
    }

    const body = upstreamResp.body;
    const proxied = new Response(body, {
      status: upstreamResp.status,
      statusText: upstreamResp.statusText,
      headers: respHeaders,
    });

    return withCorsHeaders(request, proxied);
  } catch (err) {
    return new Response(`Proxy error: ${(err as Error).message}`, { status: 502 });
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  return withCorsHeaders(request, new Response(null, { status: 204 }));
};

function withCorsHeaders(req: Request, resp: Response): Response {
  const h = new Headers(resp.headers);
  h.set('Access-Control-Allow-Credentials', 'true');
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  h.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}
