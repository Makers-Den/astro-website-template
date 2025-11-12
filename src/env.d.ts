// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="../vendor/integration/types.d.ts" />

interface ImportMetaEnv {
    readonly STORYBLOK_TOKEN: string;
    readonly STORYBLOK_SPACE_ID: string;
    readonly STORYBLOK_BLOG_FOLDER_ID: string;
    readonly STORYBLOK_BLOG_FOLDER_NAME: string;
    readonly STORYBLOK_BLOG_IMAGE_FOLDER_ID: string;
    readonly STORYBLOK_WEBHOOK_SECRET: string;
    readonly PREVIEW_SECRET: string;
    readonly COOKIE_CONSENT_ENABLED: string;
    readonly PUBLIC_ALGOLIA_APP_ID: string;
    readonly PUBLIC_ALGOLIA_INDEX_NAME: string;
    readonly ALGOLIA_API_ADMIN_TOKEN: string;
    readonly YOUTUBE_API_KEY: string;
    readonly POSTMARK_API_TOKEN: string;
    readonly SLACK_TOKEN: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  declare namespace App {
    interface Locals {
      runtime?: {
        caches?: {
          default?: Cache;
        };
        env?: ImportMetaEnv & {
          STATIC_ASSETS?: { fetch: (request: Request) => Promise<Response> };
          CF_VERSION_METADATA?: {
            id: string;
            tag: string;
            timestamp: number;
          };
        };
      };
    }
  }