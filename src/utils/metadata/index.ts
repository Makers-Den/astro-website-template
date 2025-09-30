import type { MetaData } from './types';
import { buildOgImageUrl } from '~/utils/buildOgImageUrl';
import type { GlobalSettingsStoryblok } from '~/types/storyblok';
import { isRichtextNotEmpty, richtextToString } from '~/utils/richtext';
import type { StoryblokPageComponent } from '~/types/storyblok.custom';
import type { StoryblokStory } from '~/types/storyblok';

const defaultMeta = {
  title: "Astro Website Template",
  siteName: "Astro Website Template",
  description:
    "Astro Website Template",
  url: 'https://astro-website-template.com',
  type: 'website',
  robots: 'follow, index',
} as const;

interface GenerateMetadataParams {
  blok?: StoryblokPageComponent;
  pathname: string;
  origin: string;
  globalSettingsStory?: StoryblokStory<GlobalSettingsStoryblok> | null;
}

export const generateMetadata = ({ blok, pathname, origin, globalSettingsStory }: GenerateMetadataParams): MetaData => {
  if (!blok || !globalSettingsStory) {
    return {};
  }

  const { component } = blok;

  // Safely extract properties that may not exist on all types
  const contentTitle = 'title' in blok ? blok.title : undefined;
  const type = 'type' in blok ? blok.type : undefined;
  const contentDescription = 'description' in blok ? blok.description : undefined;
  const image = 'image' in blok ? blok.image : undefined;
  const nonIndexable = 'nonIndexable' in blok ? blok.nonIndexable : undefined;
  const name = 'name' in blok ? blok.name : undefined;
  const intro = 'intro' in blok ? blok.intro : undefined;

  const ogImageUrl = buildOgImageUrl({
    title: contentTitle || defaultMeta.title,
    image: image?.filename,
    illustration: globalSettingsStory.content.illustration?.filename,
    origin,
  });

  let title = contentTitle ?? defaultMeta.title;

  if (component === 'Category') {
    title = `Latest ${name} posts`;
  }

  if (!title.includes("Makers' Den")) {
    title = `${title} - Makers' Den`;
  }

  let description = contentDescription ?? defaultMeta.description;

  if (component === 'Post' && isRichtextNotEmpty(intro)) {
    description = richtextToString(intro);
  }

  const ogType: 'article' | 'video.other' | 'website' = !type
    ? defaultMeta.type
    : type === 'case-study' || type === 'article'
      ? 'article'
      : 'video.other';

  return {
    title,
    description,
    canonical: `${defaultMeta.url}${pathname}`,
    robots: nonIndexable ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      url: `${defaultMeta.url}${pathname}`,
      siteName: defaultMeta.siteName,
      type: ogType,
      images: [{ url: ogImageUrl }],
    },
  };
};
