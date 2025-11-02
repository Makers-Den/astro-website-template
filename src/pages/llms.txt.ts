import type { APIRoute } from 'astro';
import { AVAILABLE_LANGUAGES, SITEMAP_EXCLUDED_SLUGS } from '~/utils/storyblokRepository/helpers';
import { findAllPageSlugs, getStoryblokStories } from '~/utils/storyblokRepository/apiRoutes';
import type { PostStoryblok, StoryblokStory } from '~/types/storyblok';

const config = {
  // Basic Information
  siteName: 'Astro + Storyblok Template',
  siteDescription: 'A modern, performant website template built with Astro and powered by Storyblok CMS. Perfect for building blazing-fast websites with a visual editor.',
  
  // Project Description (optional)
  projectDescription: [
    'This is a professional Astro website template that combines the best of modern web development with powerful content management.',
    'Built with performance, SEO, and developer experience in mind, it provides a solid foundation for any web project.',
  ],
  
  // Target Audience (optional)
  targetAudience: [
    'Web developers looking for a modern, performant website starter',
    'Agencies building websites for clients who need easy content management',
    'Content creators who want a fast, SEO-friendly platform',
    'Businesses seeking a professional web presence with minimal maintenance',
  ],
  
  // Main Value Proposition (optional)
  valueProposition: 'Combine Astro\'s exceptional performance with Storyblok\'s intuitive visual editor. Get a website that loads instantly, ranks well in search engines, and allows non-technical users to manage content effortlessly.',
  
  // Key Features (optional)
  keyFeatures: [
    'Lightning-fast SSR Astro website',
    'Visual content editing with Storyblok CMS',
    'Full TypeScript support for type-safe development',
    'Responsive design with Tailwind CSS',
    'SEO-optimized with automatic sitemap and metadata generation',
    'Multi-language support built-in',
    'Component-based architecture for easy customization',
    'Optimized images with lazy loading',
    'Analytics and tracking ready',
    'Deployment-ready for Cloudflare Workers',
    'Partytown support for improved performance',
  ],
  
  // Technology Stack (optional)
  techStack: [
    'Astro - SSR',
    'Storyblok - Headless CMS',
    'TypeScript - Type-safe JavaScript',
    'Tailwind CSS - Utility-first CSS framework',
    'React - Component islands (as needed)',
  ],
  
  // Use Cases (optional)
  useCases: [
    'Marketing websites with frequent content updates',
    'Blogs and content-heavy sites',
    'Portfolio websites for creatives and agencies',
    'Small to medium business websites',
    'Documentation sites with visual editing capabilities',
    'Landing pages and campaign microsites',
  ],
  
  // What Makes It Different (optional)
  differentiators: [
    'Best-in-class performance with Astro\'s partial hydration',
    'Non-technical users can edit content without touching code',
    'Built-in internationalization for global reach',
    'Developer-friendly with hot reload and TypeScript',
    'Production-ready with testing and deployment workflows',
    'Extensible architecture - add any Astro integration',
  ],
  
  // Contact Information (optional)
  contact: {
    email: 'hello@makersden.io',
    website: '', // Will be dynamically set from url.origin
    supportUrl: '/contact',
  },
}

export const GET: APIRoute = async ({ url }) => {
    const CANONICAL_BASE_URL_NO_SLASH = url.origin;


    // Build llms.txt content
    let llmsContent = `# ${config.siteName}\n\n`;
    llmsContent += `> ${config.siteDescription}\n\n`;

    // Add company/project description
    if (config.projectDescription && config.projectDescription.length > 0) {
      llmsContent += `## About\n\n`;
      config.projectDescription.forEach((desc) => {
        llmsContent += `${desc}\n\n`;
      });
    }

    // Add target audience
    if (config.targetAudience && config.targetAudience.length > 0) {
      llmsContent += `## Target Audience\n\n`;
      config.targetAudience.forEach((audience) => {
        llmsContent += `- ${audience}\n`;
      });
      llmsContent += '\n';
    }

    // Add value proposition
    if (config.valueProposition) {
      llmsContent += `## Main Value Proposition\n\n`;
      llmsContent += `${config.valueProposition}\n\n`;
    }

    // Add key features
    if (config.keyFeatures && config.keyFeatures.length > 0) {
      llmsContent += `## Key Features\n\n`;
      config.keyFeatures.forEach((feature) => {
        llmsContent += `- ${feature}\n`;
      });
      llmsContent += '\n';
    }

    // Add technology stack
    if (config.techStack && config.techStack.length > 0) {
      llmsContent += `## Technology Stack\n\n`;
      config.techStack.forEach((tech) => {
        llmsContent += `- ${tech}\n`;
      });
      llmsContent += '\n';
    }

    // Add use cases
    if (config.useCases && config.useCases.length > 0) {
      llmsContent += `## Use Cases\n\n`;
      config.useCases.forEach((useCase) => {
        llmsContent += `- ${useCase}\n`;
      });
      llmsContent += '\n';
    }

    // Add differentiators
    if (config.differentiators && config.differentiators.length > 0) {
      llmsContent += `## What Makes It Different\n\n`;
      config.differentiators.forEach((diff) => {
        llmsContent += `- ${diff}\n`;
      });
      llmsContent += '\n';
    }

    try {
        const { allSlugsWithLocale } = await findAllPageSlugs();

        // Probably should do it in a loop if there are more than 100 posts
        const posts = await getStoryblokStories<StoryblokStory<PostStoryblok>>({
          content_type: 'Post',
          per_page: 100,
        });
    
        // Filter out excluded slugs
        const filteredSlugs = allSlugsWithLocale.filter((slug) => {
          const split = slug.split('/');
          const lastSlugPart = split[split.length - 1];
          return !SITEMAP_EXCLUDED_SLUGS.includes(lastSlugPart);
        });
    
        // Group pages by type (you can customize this based on your content structure)
        const pages: string[] = [];
        const blog: {fullUrl: string, description: string}[] = [];

    
        filteredSlugs.forEach((slug) => {
          const cleanSlug = slug[slug.length - 1] === '/' ? slug.slice(0, -1) : slug;
          const fullUrl = `${CANONICAL_BASE_URL_NO_SLASH}/${cleanSlug}`;
          
          if (cleanSlug.includes('blog/')) {
            const post = posts.find((post) => post.full_slug === slug);
            blog.push({fullUrl, description: post?.content.intro || ''});

          } else {
            pages.push(fullUrl);
          }
        });
    
        // Add home page
        pages.unshift(`${CANONICAL_BASE_URL_NO_SLASH}/`);

        // Add main pages section
        if (pages.length > 0) {
            llmsContent += `## Pages\n\n`;
            pages.forEach((pageUrl) => {
                llmsContent += `- [${getPageTitle(pageUrl, CANONICAL_BASE_URL_NO_SLASH)}](${pageUrl})\n`;
            });
            llmsContent += '\n';
        }

        // Add blog posts section if available
        if (blog.length > 0) {
            llmsContent += `## Blog Posts\n\n`;
            blog.forEach((record) => {
                llmsContent += `- [${getPageTitle(record.fullUrl, CANONICAL_BASE_URL_NO_SLASH)}](${record.fullUrl})\n`;
            });
            llmsContent += '\n';

            llmsContent += `## Optionals\n\n`;
            blog.forEach((record) => {
                llmsContent += `- [${getPageTitle(record.fullUrl, CANONICAL_BASE_URL_NO_SLASH)}](${record.fullUrl}): ${record.description}\n`;
            });

            llmsContent += '\n';
        }
    } catch (error) {
        console.error('Error fetching storyblok urls:', error);
    }

    // Add contact information
    llmsContent += `## Contact Information\n\n`;
    if (config.contact?.email) {
      llmsContent += `Email: ${config.contact.email}\n`;
    }
    llmsContent += `Website: ${CANONICAL_BASE_URL_NO_SLASH}\n`;
    if (config.contact?.supportUrl) {
      llmsContent += `Contact: ${CANONICAL_BASE_URL_NO_SLASH}${config.contact.supportUrl}\n`;
    }
    llmsContent += '\n';

    // Add available languages section
    if (AVAILABLE_LANGUAGES.length > 1) {
      llmsContent += `## Languages Supported\n\n`;
      llmsContent += AVAILABLE_LANGUAGES.join(', ') + '\n\n';
    }

    // Add sitemap reference
    llmsContent += `## Sitemap\n\n`;
    llmsContent += `${CANONICAL_BASE_URL_NO_SLASH}/sitemap.xml\n\n`;

    // Add last updated timestamp
    llmsContent += `## Last Updated\n\n`;
    llmsContent += new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) + '\n';

    return new Response(llmsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  };

// Helper function to generate a readable page title from URL
function getPageTitle(url: string, baseUrl: string): string {
  const path = url.replace(baseUrl, '').replace(/^\//, '').replace(/\/$/, '');
  
  if (!path || path === '') {
    return 'Home';
  }
  
  // Convert slug to title case
  return path
    .split('/')
    .pop()!
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
