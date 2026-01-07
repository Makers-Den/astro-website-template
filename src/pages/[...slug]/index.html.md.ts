import type { LLMContextStoryblok } from '~/types/storyblok';
import { getStoryblokStory } from '~/utils/storyblokRepository/apiRoutes';

export const prerender = false;

export async function GET({ params }) {
  const slug = params.slug || 'home';
  const normalizedSlug = slug.replace(/\/$/, '').replace(/\//g, '-');
  const contextSlug = `llm-contexts/${normalizedSlug}-context`;

  try {
    const response = await getStoryblokStory<LLMContextStoryblok>(contextSlug);

    const markdownContent = response.content.markdownContent;

    return new Response(markdownContent, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching context:', error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/404',
      },
    });
  }
}
