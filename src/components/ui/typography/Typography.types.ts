// =============================================================================
// TYPOGRAPHY COMPONENT TYPES
// =============================================================================

export type TypographyVariant =
  | 'bodySmall'
  | 'body'
  | 'intro'
  | 'introLarge'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'eyebrow'
  | 'note'
  | 'navLink';

export type TypographyTag =
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'span'
  | 'div'
  | 'section'
  | 'strong'
  | 'ul'
  | 'ol'
  | 'li';

export interface TypographyProps {
  variant?: TypographyVariant;
  as?: TypographyTag;
  class?: string;
  id?: string;
  balance?: boolean;
  balanceRatio?: number;
  balancePreferNative?: boolean;
  [key: string]: unknown;
}

// =============================================================================
// VARIANT TO CLASSES MAPPING
// =============================================================================

export const variantToClasses: Record<TypographyVariant, string[]> = {
  bodySmall: ['text-xs', 'md:text-sm', 'lg:text-sm', 'leading-5', 'text-current'],
  body: ['text-sm', 'md:text-base', 'lg:text-base', 'leading-6', 'text-current'],
  intro: ['text-base', 'md:text-lg', 'lg:text-lg', 'leading-6', 'text-current'],
  introLarge: ['text-lg', 'md:text-xl', 'lg:text-xl', 'leading-7', 'text-current'],
  h1: [
    'text-4xl',
    'sm:text-5xl',
    'md:text-6xl',
    'font-extrabold',
    'text-current',
    'font-headline',
    'tracking-tight',
    'break-words',
  ],
  h2: ['text-3xl', 'sm:text-4xl', 'font-bold', 'tracking-tight', 'text-current'],
  h3: [
    'text-xl',
    'md:text-3xl',
    'lg:text-3xl',
    'font-medium',
    'text-current',
    'font-headline',
    'tracking-tight',
    'break-words',
  ],
  h4: [
    'text-lg',
    'md:text-xl',
    'lg:text-xl',
    'font-medium',
    'text-current',
    'font-headline',
    'tracking-tight',
    'break-words',
  ],
  h5: [
    'text-base',
    'md:text-lg',
    'lg:text-lg',
    'font-medium',
    'text-current',
    'font-headline',
    'tracking-tight',
    'break-words',
  ],
  h6: [
    'text-sm',
    'md:text-base',
    'lg:text-base',
    'font-medium',
    'text-current',
    'font-headline',
    'tracking-tight',
    'break-words',
  ],
  eyebrow: ['text-base', 'font-semibold', 'uppercase', 'tracking-wider', 'text-primary-800'],
  note: ['text-xs', 'text-dark'],
  navLink: ['text-lg', 'font-medium', 'rounded-xl', 'text-gray-500'],
};
