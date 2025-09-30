import type { StoryblokMultilink, StoryblokVersion } from "~/types/storyblok.custom";
import { isLinkWithAnchor, isLinkAsset, isLinkStory, isLinkEmail } from "../typeGuards";
import { type SbBlokData, storyblokEditable } from "@storyblok/astro";
import type { CategoryStoryblok, PostStoryblok, StoryblokComponent, StoryblokStory } from "~/types/storyblok";
import type { AstroCookies } from "astro";

export const RESOLVED_RELATIONS_ARRAY = ['ArticleCard.post', 'Post.author', 'FeaturedPosts.posts', 'Post.categories', 'LatestPosts.category'];
export const SITEMAP_EXCLUDED_SLUGS = ['home', 'not-found', 'dev-page', 'thank-you'];
export const ALL_PAGE_TYPES = ['Page', 'Post'];
export const AVAILABLE_LANGUAGES = ['en','de', 'he'];

export const sbLinkToHref = (sbLink: StoryblokMultilink | undefined): string => {
    if (!sbLink) return '';
    const anchor = isLinkWithAnchor(sbLink) ? '#' + sbLink.anchor : '';
  
    if (isLinkAsset(sbLink)) {
      return `${sbLink.url}${anchor}`;
    }
  
    if (isLinkStory(sbLink)) {
      const link = `${sbLink.cached_url}${anchor}`;
      if (link === '') return '#';
      if (sbLink.cached_url === 'home') return '/';
  
      const computedLink = link.startsWith('/') ? link : '/' + link;
      return computedLink.endsWith('/') ? computedLink.slice(0, -1) : computedLink;
    }
  
    if (isLinkEmail(sbLink)) {
      return `mailto:${sbLink.email}`;
    }
  
    return '#';
  };

  export function getStoryblokImageUrl(
    imageUrl: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpg' | 'png';
      fit?: 'in' | 'out' | 'fill' | 'crop';
      smart?: boolean;
      filters?: {
        blur?: number;
        brightness?: number;
        contrast?: number;
        grayscale?: boolean;
      };
    }
  ) {
    if (!imageUrl) return '';
  
    let optimizedUrl = imageUrl;
    const filterSegments: string[] = [];
  
    if (options?.width || options?.height || options?.format || options?.quality || options?.filters) {
      const width = options?.width || 0;
      const height = options?.height || 0;
      optimizedUrl += `/m/${width}x${height}`;
    }
  
    if (options?.quality) {
      filterSegments.push(`quality(${options.quality})`);
    }
  
    if (options?.format) {
      filterSegments.push(`format(${options.format})`);
    }
  
    if (options?.filters) {
      if (options.filters.blur) {
        filterSegments.push(`blur(${options.filters.blur})`);
      }
  
      if (options.filters.brightness) {
        filterSegments.push(`brightness(${options.filters.brightness})`);
      }
  
      if (options.filters.contrast) {
        filterSegments.push(`contrast(${options.filters.contrast})`);
      }
  
      if (options.filters.grayscale) {
        filterSegments.push('grayscale()');
      }
    }
  
    if (filterSegments.length > 0) {
      optimizedUrl += '/filters:' + filterSegments.join(':');
    }
  
    return optimizedUrl;
  }
  
export function getResponsiveStoryblokImageSrcSet(
    imageUrl: string,
    sizes: number[] = [320, 480, 640, 768, 1024],
    options?: {
      quality?: number;
      format?: 'webp' | 'avif' | 'jpg' | 'png';
      useDensityDescriptors?: boolean;
      baseWidth?: number;
    }
  ): string | undefined {
    if (!imageUrl || sizes.length === 0) return undefined;
  
    if (options?.useDensityDescriptors && options?.baseWidth) {
      return sizes
        .map((multiplier) => {
          const width = options.baseWidth! * multiplier;
          const optimizedUrl = getStoryblokImageUrl(imageUrl, {
            width,
            height: 0,
            quality: options?.quality || 80,
            format: options?.format || 'webp',
          });
          return `${optimizedUrl} ${multiplier}x`;
        })
        .join(', ');
    }
  
    return sizes
      .map((size) => {
        const optimizedUrl = getStoryblokImageUrl(imageUrl, {
          width: size,
          height: 0,
          quality: options?.quality || 80,
          format: options?.format || 'webp',
        });
        return `${optimizedUrl} ${size}w`;
    })
    .join(", ");
}

export function makeEditable<T extends SbBlokData | StoryblokComponent>(blok: T) {
    if (!blok || !blok._editable) return {};
    return storyblokEditable(blok as SbBlokData);
  }



export function getStoryblokVersion(cookies: AstroCookies): StoryblokVersion | undefined {
    return cookies.get('storyblok-version')?.value as StoryblokVersion | undefined;
}

export function isStoryResolved<T extends StoryblokComponent>(story: unknown): story is StoryblokStory<T> {
  return !!(story && typeof story === 'object');
}

export const isCategoriesStory = (
  categories: PostStoryblok['categories']
): categories is StoryblokStory<CategoryStoryblok>[] => {
  return typeof categories?.[0] !== 'string';
};