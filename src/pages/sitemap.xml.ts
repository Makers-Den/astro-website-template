import type { APIRoute } from 'astro';
import { AVAILABLE_LANGUAGES, SITEMAP_EXCLUDED_SLUGS } from '~/utils/storyblokRepository/helpers';
import { findAllPageSlugs } from '~/utils/storyblokRepository/apiRoutes';

const DEFAULT_LOCALE = 'en';

export const GET: APIRoute = async ({ url }) => {
  try {
    const { allSlugsWithLocale } = await findAllPageSlugs();

    const CANONICAL_BASE_URL_NO_SLASH = url.origin;

    const sitemapSlugs = allSlugsWithLocale.filter((slug) => {
      const split = slug.split('/');
      const lastSlugPart = split[split.length - 1];
      return !SITEMAP_EXCLUDED_SLUGS.includes(lastSlugPart);
    });

    const sitemapFields = sitemapSlugs.map((sitemapSlug) => {
      const slug = sitemapSlug[sitemapSlug.length - 1] === '/' ? sitemapSlug.slice(0, -1) : sitemapSlug;
      const alternates = AVAILABLE_LANGUAGES.map((locale) => ({
        locale,
        url: `${CANONICAL_BASE_URL_NO_SLASH}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/${slug}`,
      }));
      return {
        default: {
        url: `${CANONICAL_BASE_URL_NO_SLASH}/${slug}`,
        lastModified: new Date().toISOString(),
      },
      alternates,
    };
    });

    // Add home page index manually
    sitemapFields.push({
      default: {
        url: `${CANONICAL_BASE_URL_NO_SLASH}/`,
        lastModified: new Date().toISOString(),
      },
      alternates: AVAILABLE_LANGUAGES.map((locale) => ({
        locale,
        url: `${CANONICAL_BASE_URL_NO_SLASH}/${locale}`,
      })),
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="https://www.sitemaps.org/schemas/sitemap/0.9 https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
    https://www.w3.org/1999/xhtml https://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd"
    xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="https://www.w3.org/1999/xhtml"   
>
  ${sitemapFields
    .map(
      (field) => `
  <url>
    <loc>${field.default.url}</loc>
    <priority>${field.default.url === `${CANONICAL_BASE_URL_NO_SLASH}/` ? '1.0' : '0.8'}</priority>
    ${field.alternates
      .map((alt) => `<xhtml:link rel="alternate" hreflang="${alt.locale}" href="${alt.url}" />`)
      .join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${field.default.url}" />
    <lastmod>${field.default.lastModified}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
  `
    )
    .join('')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Fallback to basic sitemap if Storyblok is unavailable
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url.origin}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }
};
