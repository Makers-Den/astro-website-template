interface BuildOgImageUrlParams {
    title: string;
    image?: string;
    illustration?: string;
    origin: string;
  }
  
  export const buildOgImageUrl = ({ title, image, illustration, origin }: BuildOgImageUrlParams): string => {
    if (image) {
      return image;
    }
  
    const uriEncodedTitle = encodeURIComponent(title ?? '');
    const uriEncodedIllustrationUrl = encodeURIComponent(illustration ?? '');
  
    let path;
    if (title) {
      path = `api/og?title=${uriEncodedTitle}&imageUrl=${uriEncodedIllustrationUrl}`;
    } else {
      path = `api/default-og?imageUrl=${uriEncodedIllustrationUrl}`;
    }
  
    return origin + '/' + path;
  };
  