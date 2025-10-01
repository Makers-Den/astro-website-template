import type { APIRoute } from 'astro';
import { STORYBLOK_WEBHOOK_SECRET, CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_KEY, PUBLIC_SITE_URL } from 'astro:env/server';
import { storyblokApi as storyblokApiInstanceAPIRoute } from '@storyblok/astro/client';
import type { StoryblokStory } from '~/types/storyblok';

const removeTrailingSlash = (p: string) => p.replace(/\/$/, '');

type WebhookBody = {
  story_id?: number | string;
  action?: string;
};

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const secret = url.searchParams.get('secret');
    if (secret !== STORYBLOK_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Invalid secret' }), { status: 401 });
    }

    const body = (await request.json()) as WebhookBody;
    const storyId = body?.story_id;
    const action = body?.action;

    if (!storyId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields: story_id or action' }), { status: 400 });
    }

    const res = await storyblokApiInstanceAPIRoute.get(`cdn/stories/${storyId}`, {
      version: 'published',
    });

    const story = res.data.story as StoryblokStory;

    // Skip cache invalidation on first publish
    const isFirstPublish = Boolean(story?.first_published_at) && story.first_published_at === story.published_at;

    if (isFirstPublish) {
      return new Response(JSON.stringify({ success: true, purged: false, data: 'first publish', storyId, action }), {
        status: 200,
      });
    }

    if (story.full_slug === 'global-settings') {
      const url = new URL(PUBLIC_SITE_URL);
      const purgeResults = await purgeCloudflareCache({ hosts: [url.hostname] });
      return new Response(JSON.stringify({ success: true, purged: 'all', data: purgeResults }), { status: 200 });
    } else {
      const tagToPurge = `html:${url.hostname}/${removeTrailingSlash(story.full_slug)}`;

      const purgeResult = await purgeCloudflareCache({ tags: [tagToPurge] });

      return new Response(JSON.stringify({ success: true, purged: tagToPurge, data: purgeResult?.response }), {
        status: 200,
      });
    }
  } catch (error) {
    console.log({ error });
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

interface PurgeCloudflareCacheOptions {
  tags?: string[];
  purge_everything?: boolean;
  hosts?: string[];
}

async function purgeCloudflareCache(options: PurgeCloudflareCacheOptions) {
  if (CLOUDFLARE_ZONE_ID && CLOUDFLARE_API_KEY) {
    const resp = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
      },
      body: JSON.stringify(options),
    });
    const json = await resp.json().catch(() => ({}));
    return { response: json };
  }
}
