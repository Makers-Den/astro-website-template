import type { APIRoute } from 'astro';
import {  getStoryblokStories, getStoryblokStory } from '~/utils/storyblokRepository/apiRoutes';
import type { LLMContextStoryblok, StoryblokStory } from '~/types/storyblok';
import type { StoryblokPageComponent } from '~/types/storyblok.custom';

export const GET: APIRoute = async ({ url }) => {
    let llmsContent = '';

    try {
        const llmsTxtStory = await getStoryblokStory<LLMContextStoryblok>('llm-contexts/llms-txt');
        if (!llmsTxtStory.content.markdownContent) {
            throw new Error('LLMS TXT story not found');
        }

        llmsContent = llmsTxtStory.content.markdownContent + '\n\n';

        // Probably should do it in a loop if there are more than 100 posts
        const pagesWithLLMsContext = await getStoryblokStories<StoryblokStory<StoryblokPageComponent>>({
            filter_query: [
              {
                condition: '[markdown][is]',
                value: true,
              }
            ],
        });

        if (pagesWithLLMsContext.length > 0) {
            llmsContent += `## Optionals\n\n`;
            pagesWithLLMsContext.forEach((record) => {
                llmsContent += `- [${getPageTitle(record.full_slug)}](${new URL(record.full_slug, url.origin).toString()}/index.html.md)\n`;
            });

            llmsContent += '\n';
        }
    } catch (error) {
        console.error('Error fetching storyblok urls:', error);
    }
    return new Response(llmsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  };

// Helper function to generate a readable page title from URL
function getPageTitle(url: string): string {
  const path = url.replace(/^\//, '').replace(/\/$/, '');
  
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
