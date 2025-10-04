import path from 'path';
import { fileURLToPath } from 'url';
import react from '@astrojs/react';

import { defineConfig, envField, passthroughImageService } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import compress from 'astro-compress';
import { storyblok } from '@storyblok/astro';
import cloudflare from '@astrojs/cloudflare';
import partytown from '@astrojs/partytown';

import mkcert from 'vite-plugin-mkcert';

import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare',
    platformProxy: {
      enabled: true,
    },
  }),
  server: {
    port: 3010,
    host: true,
  },
  security: {
    checkOrigin: false,
  },
  env: {
    schema: {
      STORYBLOK_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      STORYBLOK_VERSION: envField.string({ context: 'client', access: 'public' }),
      PREVIEW_SECRET: envField.string({ context: 'server', access: 'secret' }),
      COOKIE_CONSENT_ENABLED: envField.string({ context: 'server', access: 'public' }),
      PUBLIC_STAPE_URL: envField.string({ context: 'server', access: 'public' }),
      PUBLIC_STAPE_GTM_SCRIPT_LINK: envField.string({ context: 'server', access: 'public' }),
      PUBLIC_STAPE_GTM_SCRIPT_ARG: envField.string({ context: 'server', access: 'public' }),
      STORYBLOK_MANAGEMENT_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      STORYBLOK_SPACE_ID: envField.string({ context: 'server', access: 'public' }),
      STORYBLOK_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret' }),
      CLOUDFLARE_ZONE_ID: envField.string({ context: 'server', access: 'public' }),
      CLOUDFLARE_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_GTM_ID: envField.string({ context: 'server', access: 'public' }),
      PUBLIC_SITE_URL: envField.string({ context: 'server', access: 'public' }),
    },
    validateSecrets: true,
  },
  site: env.PUBLIC_SITE_URL,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'he'],
  },
  experimental: {
    fonts: [
      {
        name: 'Inter',
        cssVariable: '--font-inter',
        provider: 'local',
        variants: [
          {
            src: ['./src/assets/fonts/inter-variable.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
        fallbacks: ['system-ui', 'sans-serif'],
      },
    ],
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    storyblok({
      accessToken: env.STORYBLOK_TOKEN || '',
      bridge: {
        resolveRelations: [
          'ArticleCard.post',
          'Post.author',
          'FeaturedPosts.posts',
          'Post.categories',
          'LatestPosts.category',
        ],
      },
      livePreview: true,
      apiOptions: {
        region: 'eu',
        timeout: 5000, // 5 second timeout - shorter to prevent hanging in Cloudflare Workers
      },
      componentsDir: 'src/components',
      enableFallbackComponent: true,
      customFallbackComponent: 'storyblok/block-components/CustomFallbackComponent',
    }),

    icon(),
    partytown({
      config: {
        forward: [
          ['dataLayer.push', { preserveBehavior: true }],
          ['gtag', { preserveBehavior: true }],
          ['gtm.push', { preserveBehavior: true }],
        ],
        loadScriptsOnMainThread: ['https://cdn-cookieyes.com', 'https://script.cookieyes.com', /cookieyes/i],
        resolveUrl: (url, location) => {
          if (url.origin === location.origin || url.hostname.includes('cookieyes')) return url;
          const proxyUrl = new URL('/api/partytown-proxy', location.origin);
          proxyUrl.searchParams.append('url', url.href);
          return proxyUrl;
        },
      },
    }),
    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: true,
      Logger: 1,
    }),
  ],

  image: {
    domains: ['a.storyblok.com'],
    service: passthroughImageService(),
  },
  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
        '@/fonts': path.resolve(__dirname, './src/assets/fonts'),
        ...((process.env.NODE_ENV === 'production') ? { 'react-dom/server': 'react-dom/server.edge' } : {}),
      },
    },
    ssr: {
      external: [
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:url',
        'node:crypto',
        'node:buffer',
        'node:http2',
        'fs',
        'os',
        'path',
        'child_process',
        'crypto',
        'tty',
        'worker_threads',
      ],
      resolve: {
        conditions: ['workerd', 'worker', 'browser'],
        externalConditions: ['workerd', 'worker'],
      },
    },
    build: {
      cssCodeSplit: false, // Inline CSS instead of separate files
    },
    plugins: [mkcert()],
  },
});
