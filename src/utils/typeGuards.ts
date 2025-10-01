import type { StoryblokMultilink } from '~/types/storyblok.custom';

// Type guards for links
export const isLinkWithAnchor = (link: StoryblokMultilink): boolean => !!link?.anchor;
export const isLinkEmail = (link: StoryblokMultilink): boolean => link?.linktype === 'email';
export const isLinkStory = (link: StoryblokMultilink): boolean => link?.linktype === 'story';
export const isLinkAsset = (link: StoryblokMultilink): boolean =>
  link?.linktype === 'asset' || link?.linktype === 'url';
