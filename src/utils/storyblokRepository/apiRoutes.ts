import type { StoryblokStory } from '~/types/storyblok';
import { ALL_PAGE_TYPES, SITEMAP_EXCLUDED_SLUGS } from './helpers';
import { storyblokApi as storyblokApiInstanceAPIRoute } from '@storyblok/astro/client';

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
