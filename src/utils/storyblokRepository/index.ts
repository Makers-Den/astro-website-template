import type { ISbStoriesParams, ISbStoryParams } from "@storyblok/astro";
import useStoryblokApi from "../useStoryblokApi";
import type { StoryblokStoriesResponse, StoryblokStoryResponse } from "~/types/storyblok.custom";
import type { GlobalSettingsStoryblok, StoryblokStory } from "~/types/storyblok";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });
  
    return Promise.race([promise, timeoutPromise]);
  }

export interface Filter {
    [key: string]: unknown;
}
  
const buildFilterQuery = (query: Filter | Filter[] | undefined) => {
  if (!query) {
    return {};
  }

  const queries = Array.isArray(query) ? query : [query];

  return queries.reduce((acc, { condition, value }) => {
    return { ...acc, [`filter_query${condition}`]: value };
  }, {});
};

export async function getStoryblokStory<T = Record<string, unknown>>(slug: string, params?: ISbStoryParams) {
  const storyblokApi = useStoryblokApi();

  if (!storyblokApi) {
    throw new Error('Storyblok API not initialized');
  }

  const apiCall = storyblokApi.get(`cdn/stories/${slug}`, {
    ...params,
    version: params?.version || (import.meta.env.DEV ? 'draft' : 'published'),
  });

  const response = (await withTimeout(apiCall, 5000)) as StoryblokStoryResponse<T>;
  return response.data.story;
}

export async function getStoryblokStories<T = Record<string, unknown>>(options: ISbStoriesParams) {
    const storyblokApi = useStoryblokApi();
  
    if (!storyblokApi) {
      throw new Error('Storyblok API not initialized');
    }
  
    const { filter_query, ...rest } = options;
  
    const apiCall = storyblokApi.get('cdn/stories', {
      ...rest,
      ...buildFilterQuery(filter_query),
      version: options?.version || (import.meta.env.DEV ? 'draft' : 'published'),
    });
  
    const response = (await withTimeout(apiCall, 5000)) as StoryblokStoriesResponse<T>;
    return response.data.stories;
  }

  export async function getGlobalSettingsStory(
    options?: ISbStoryParams
  ): Promise<StoryblokStory<GlobalSettingsStoryblok> | null> {
    try {
      const storyblokApi = useStoryblokApi();
  
      if (!storyblokApi) {
        console.warn('Storyblok API not initialized, using fallback data');
        return null;
      }
  
      const apiCall = storyblokApi.get('cdn/stories/global-settings', {
        ...options,
        version: options?.version || (import.meta.env.DEV ? 'draft' : 'published'),
      });
  
      const response = (await withTimeout(apiCall, 3000)) as StoryblokStoryResponse<GlobalSettingsStoryblok>;
      return response.data.story;
    } catch (error) {
      console.warn('Could not fetch global settings story:', error);
      return null;
    }
  }

export async function getGlobalSettings(options?: ISbStoryParams): Promise<GlobalSettingsStoryblok | null> {
    try {
      const story = await getGlobalSettingsStory(options);
      return story?.content || null;
    } catch (error) {
      console.warn('Could not fetch global settings:', error);
      return null;
    }
  }
  
  export async function getStoryblokStoryWithRelations<T = Record<string, unknown>>(
    slug: string,
    options: ISbStoryParams
  ) {
    const storyblokApi = useStoryblokApi();
  
    if (!storyblokApi) {
      throw new Error('Storyblok API not initialized');
    }
  
    const apiCall = storyblokApi.get(`cdn/stories/${slug}`, {
      ...options,
      version: options?.version || (import.meta.env.DEV ? 'draft' : 'published'),
    });
  
    const response = (await withTimeout(apiCall, 8000)) as StoryblokStoryResponse<T>;
    return response.data.story;
  }