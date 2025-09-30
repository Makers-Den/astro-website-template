import type { StoryblokStory } from '~/types/storyblok';
import { ALL_PAGE_TYPES, SITEMAP_EXCLUDED_SLUGS } from './helpers';
import { storyblokApi as storyblokApiInstanceAPIRoute } from '@storyblok/astro/client';
import { STORYBLOK_MANAGEMENT_TOKEN, STORYBLOK_SPACE_ID } from 'astro:env/server';
import StoryblokClient from 'storyblok-js-client';

export const findAllPageSlugs = async () => {
  const storyblokApi = storyblokApiInstanceAPIRoute;

  if (!storyblokApi) {
    console.warn('Storyblok API not initialized, returning empty sitemap');
    return { allSlugsWithLocale: [], allSlugsWithoutLocale: [] };
  }

  try {
    const allPageStoryResults = await Promise.all(
      ALL_PAGE_TYPES.map((contentType) =>
        storyblokApi.get('cdn/stories', {
          version: import.meta.env.DEV ? 'draft' : 'published',
          content_type: contentType,
          per_page: 100,
        })
      )
    );

    const allSlugsWithLocale = allPageStoryResults
      .map((result) => result.data.stories.map((story: StoryblokStory) => story.full_slug))
      .flat();

    const allSlugsWithoutLocale = [
      ...new Set(
        allSlugsWithLocale.filter((slug) => {
          const split = slug.split('/');
          const lastSlugPart = split[split.length - 1];
          return !SITEMAP_EXCLUDED_SLUGS.includes(lastSlugPart);
        })
      ),
    ];

    return {
      allSlugsWithLocale,
      allSlugsWithoutLocale,
    };
  } catch (error) {
    console.error('Error fetching page slugs for sitemap:', error);
    return { allSlugsWithLocale: [], allSlugsWithoutLocale: [] };
  }
};

export const getStoryblokStoriesForComponent = async (storyblokComponent: string) => {
  // Using Storyblok JS Client instead of the Astro client because the Astro client doesn't support the management token
  const storyblokApi = new StoryblokClient({
    oauthToken: STORYBLOK_MANAGEMENT_TOKEN,
  });

  if (!storyblokApi) {
    throw new Error('Storyblok API not initialized');
  }

  let page = 1;
  const perPage = 100;
  let allMatchingStories: StoryblokStory[] = [];

  while (true) {
    const stories = await storyblokApi.get(`spaces/${STORYBLOK_SPACE_ID}/stories/`, {
      contain_component: storyblokComponent,
      per_page: perPage,
      page,
    });
    allMatchingStories = allMatchingStories.concat(stories.data.stories);

    if (stories.data.stories.length < perPage) break;
    page++;
  }

  return allMatchingStories;
};
