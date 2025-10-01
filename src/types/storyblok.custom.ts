import type { CategoryStoryblok, PageStoryblok, PostStoryblok, StoryblokRichtext, StoryblokStory } from './storyblok';

export type StoryblokPageComponent = PageStoryblok | PostStoryblok | CategoryStoryblok;

export type StoryblokMultilink = {
  url?: string;
  cached_url?: string;
  anchor?: string;
  linktype?: 'asset' | 'url' | 'story' | 'email';
  email?: string;
  id?: string;
  story?: unknown;
};

export interface StoryblokStoryResponse<T = Record<string, unknown>> {
  data: {
    story: StoryblokStory<T>;
  };
}

export interface StoryblokStoriesResponse<T = Record<string, unknown>> {
  data: {
    stories: T[];
  };
}

export interface BlokProps<T = Record<string, unknown>> {
  blok: T;
}

export type StoryblokBlock = {
  _uid: string;
  component: string;
  _editable: string;
  [key: string]: BlockFields;
};

export type BlockFields = string | boolean | StoryblokRichtext | StoryblokBlock[];

export type StoryblokVersion = 'draft' | 'published';
