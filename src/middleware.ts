import type { MiddlewareHandler } from 'astro';

const removeTrailingSlash = (p: string) => p.replace(/\/$/, '');
const isCacheablePath = (p: string) => !p.startsWith('/api');

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const { request, url } = ctx;

  if (request.method !== 'GET' || !isCacheablePath(url.pathname)) {
    return next();
  }

  const cfCache: Cache | undefined = ctx.locals?.runtime?.caches?.default;
  const cfVersionMetadata = ctx.locals?.runtime?.env?.CF_VERSION_METADATA;

  if (!cfCache) return next();

  const versionedUrl = new URL(request.url);
  versionedUrl.searchParams.set('v', cfVersionMetadata?.id ?? '');
  const key = new Request(versionedUrl.toString(), request);

  const cached = await cfCache.match(key);
  if (cached) {
    const hit = new Response(cached.body, cached);
    return hit;
  }

  // Render upstream
  const res = await next();

  // Cache only successful HTML without Set-Cookie
  const headers = new Headers(res.headers);
  const ct = headers.get('content-type') || '';
  const hasSetCookie = headers.has('set-cookie');
  const isHTML = ct.includes('text/html');

  if (res.ok && isHTML && !hasSetCookie) {
    headers.set('cache-control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600');
    headers.set('vary', 'accept-encoding');
    headers.set('Cache-Tag', `html:${url.hostname}${removeTrailingSlash(url.pathname)}`);

    const toCache = new Response(res.body, { status: res.status, headers });
    await cfCache.put(key, toCache.clone()); // First hit pays; next are instant

    const miss = new Response(toCache.body, toCache);
    return miss;
  }

  return res;
};
