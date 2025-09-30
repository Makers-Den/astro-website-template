import { getImage } from 'astro:assets';
import { transformUrl, parseUrl } from 'unpic';

import type { ImageMetadata } from 'astro';

export type ImagesOptimizer = (
  image: ImageMetadata | string,
  breakpoints: number[],
  width?: number,
  height?: number,
  format?: string
) => Promise<Array<{ src: string; width: number }>>;

const computeHeight = (width: number, aspectRatio: number) => {
  return Math.floor(width / aspectRatio);
};

export const astroAssetsOptimizer: ImagesOptimizer = async (
  image,
  breakpoints,
  _width,
  _height,
  format = undefined
) => {
  if (!image) {
    return [];
  }

  return Promise.all(
    breakpoints.map(async (w: number) => {
      const result = await getImage({ src: image, width: w, inferSize: true, ...(format ? { format: format } : {}) });

      return {
        src: result?.src,
        width: result?.attributes?.width ?? w,
        height: result?.attributes?.height,
      };
    })
  );
};

export const isUnpicCompatible = (image: string) => {
  return typeof parseUrl(image) !== 'undefined';
};

export const unpicOptimizer: ImagesOptimizer = async (image, breakpoints, width, height, format = undefined) => {
  if (!image || typeof image !== 'string') {
    return [];
  }

  const urlParsed = parseUrl(image);
  if (!urlParsed) {
    return [];
  }

  return Promise.all(
    breakpoints.map(async (w: number) => {
      const _height = width && height ? computeHeight(w, width / height) : height;
      const url =
        transformUrl({
          url: image,
          width: w,
          height: _height,
          cdn: urlParsed.cdn,
          ...(format ? { format: format } : {}),
        }) || image;
      return {
        src: String(url),
        width: w,
        height: _height,
      };
    })
  );
};

export function calculateSmartBreakpoints(width: number, sizes?: string): number[] {
  if (!sizes) {
    const defaultBreakpoints = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    return defaultBreakpoints.filter((bp) => bp >= width).slice(0, 6);
  }

  const breakpoints = new Set<number>();

  const maxWidthMatches = sizes.match(/\(max-width:\s*(\d+)px\)/g);
  if (maxWidthMatches) {
    maxWidthMatches.forEach((match) => {
      const width = parseInt(match.match(/(\d+)/)?.[1] || '0');
      if (width > 0) breakpoints.add(width);
    });
  }

  const minWidthMatches = sizes.match(/\(min-width:\s*(\d+)px\)/g);
  if (minWidthMatches) {
    minWidthMatches.forEach((match) => {
      const width = parseInt(match.match(/(\d+)/)?.[1] || '0');
      if (width > 0) breakpoints.add(width);
    });
  }

  const vwMatches = sizes.match(/(\d+(?:\.\d+)?)vw/g);
  if (vwMatches) {
    const viewportSizes = [320, 375, 425, 768, 1024, 1440, 2560];
    vwMatches.forEach((match) => {
      const vwValue = parseFloat(match.replace('vw', ''));
      viewportSizes.forEach((viewport) => {
        const calculatedWidth = Math.round((viewport * vwValue) / 100);
        if (calculatedWidth > 0) breakpoints.add(calculatedWidth);
      });
    });
  }

  const pxMatches = sizes.match(/(\d+)px/g);
  if (pxMatches) {
    pxMatches.forEach((match) => {
      const width = parseInt(match.replace('px', ''));
      if (width > 0) breakpoints.add(width);
    });
  }

  const remMatches = sizes.match(/(\d+(?:\.\d+)?)rem/g);
  if (remMatches) {
    remMatches.forEach((match) => {
      const remValue = parseFloat(match.replace('rem', ''));
      const pixelValue = Math.round(remValue * 16);
      if (pixelValue > 0) breakpoints.add(pixelValue);
    });
  }

  let finalBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);

  if (finalBreakpoints.length === 0) {
    finalBreakpoints = [640, 750, 828, 1080, 1200, 1920];
  }

  finalBreakpoints.push(width);
  finalBreakpoints = [...new Set(finalBreakpoints)].sort((a, b) => a - b);

  return finalBreakpoints.slice(0, 8);
}
