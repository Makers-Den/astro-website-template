export const parsedConfig = {
  metadata: {
    title: {
      default: 'Makers Den - Your ReactJS Agency for Web & Apps',
      template: '%s — Makers Den',
    },
    description:
      "Makers' Den is a ReactJS Development Agency. Talk to us about Frontend or Full-stack ReactJS, React Native Mobile Apps and Fast Headless CMS based Websites.",
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      site_name: 'Makers Den',
      images: [
        {
          url: 'https://a.storyblok.com/f/188026/1200x630/0ce03d1528/og-image-1200x630.png',
          width: 1200,
          height: 630,
        },
      ],
      type: 'website',
    },
    twitter: {
      handle: '@makers_den',
      site: '@makers_den',
      cardType: 'summary_large_image',
    },
  },
};

export default parsedConfig;

