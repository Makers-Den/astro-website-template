import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const clsxm = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export enum ButtonVariant {
  'primary',
  'outline',
  'ghost',
  'light',
  'dark',
  'white',
}

export const buttonVariantStyles: {
  [key in keyof typeof ButtonVariant]: string[];
} = {
  primary: [
    'bg-primary-500 text-white',
    'border border-primary-600',
    'hover:bg-primary-600 hover:text-white',
    'active:bg-primary-500',
    'disabled:bg-primary-400 disabled:hover:bg-primary-400',
  ],
  outline: [
    'text-primary-500',
    'border border-primary-500',
    'hover:bg-primary-50 active:bg-primary-100 disabled:bg-primary-100',
  ],
  ghost: ['text-primary-500', 'shadow-none', 'hover:bg-primary-50 active:bg-primary-100 disabled:bg-primary-100'],
  light: [
    'bg-white text-dark ',
    'border border-gray-300',
    'hover:bg-gray-100 hover:text-dark',
    'active:bg-white/80 disabled:bg-gray-200',
  ],
  dark: [
    'bg-gray-900 text-white',
    'border border-gray-600',
    'hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-700',
  ],
  white: ['bg-white text-primary-000', 'border border-transparent', 'hover:bg-primary-50 ', 'shadow'],
};

export function ensurePreceedingSlash(href: string) {
  if (href.startsWith('http')) {
    return href;
  }

  if (href.substring(0, 1) !== '/') {
    return `/${href}`;
  }

  return href;
}

export function getFormattedDate(date: string) {
  const formatDate = new Date(date.slice(0, 9));
  const year = formatDate.getFullYear();
  const day = formatDate.getDay();
  const month = formatDate.toLocaleString('en-US', { month: 'short' });
  const wholeDate = `${month} ${day}, ${year}`;

  return wholeDate;
}

export const trim = (str = '', ch?: string) => {
  let start = 0,
    end = str.length || 0;
  while (start < end && str[start] === ch) ++start;
  while (end > start && str[end - 1] === ch) --end;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
};
