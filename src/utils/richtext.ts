import type { StoryblokRichtext } from "~/types/storyblok";
import type { BlockFields } from "~/types/storyblok.custom";

export const sentenceToId = (sentence: string): string => {
    return sentence
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  export const richtextToString = (richtext: StoryblokRichtext): string => {
    if (!richtext?.content) {
      return '';
    }
    return richtext.content.map((block) => block?.content?.map((inline) => inline.text).join('')).join('\n');
  };
  
  export const isValidRichtext = (value: BlockFields | undefined): value is StoryblokRichtext => {
    if (!value) return false;
    return Object.prototype.hasOwnProperty.call(value, 'type') && (value as StoryblokRichtext)?.type === 'doc';
  };
  
  export const isRichtextNotEmpty = (value: BlockFields | undefined): value is StoryblokRichtext => {
    if (!isValidRichtext(value)) return false;
    return (
      value.content?.some(
        (node) =>
          Array.isArray(node?.content) &&
          node.content.some((inline) => typeof inline?.text === 'string' && inline.text.trim().length > 0)
      ) ?? false
    );
  };