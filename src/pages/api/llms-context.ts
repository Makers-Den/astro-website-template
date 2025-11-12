import type { APIRoute } from 'astro';
import { STORYBLOK_WEBHOOK_SECRET, STORYBLOK_SPACE_ID, STORYBLOK_MANAGEMENT_TOKEN, OPENAI_API_KEY, STORYBLOK_LLM_CONTEXTS_FOLDER_ID } from 'astro:env/server';
import type { StoryblokPageComponent } from '~/types/storyblok.custom';
import { getStoryblokStory } from '~/utils/storyblokRepository/apiRoutes';
import OpenAI from 'openai';
import type { LLMContextStoryblok } from '~/types/storyblok';

type WebhookBody = {
    story_id: number;
    action: string;
    full_slug: string;
  };

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const secret = url.searchParams.get('secret');
    if (secret !== STORYBLOK_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Invalid secret' }), { status: 401 });
    }

    const payload: WebhookBody = await request.json();
    
    if (payload.action !== 'published') {
      return new Response(JSON.stringify({ 
        message: 'Not a publish event, skipping',
        action: payload.action 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const story = await getStoryblokStory<StoryblokPageComponent>(payload.full_slug);
    if (!("markdown" in story.content) || story.content.markdown !== true) {
        return new Response(JSON.stringify({ 
            message: 'Not accepting llms contexts. Skpping',
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
    }

    const pageUrl = new URL(story.full_slug, url.origin)

    const markdownContent = await generateMarkdownContext(pageUrl.toString());

    const normalizedSlug = story.full_slug.replace(/\/$/, '').replace(/\//g, '-');
    const contextFullSlug = `llm-contexts/${normalizedSlug}-context`;
    
    const contextStories = await searchForContextStories(contextFullSlug);
    if (contextStories && contextStories.length === 1) {
        await updateContextStory(
            contextStories[0].id,
            story.id,
            story.full_slug,
            markdownContent
          );
    } else if (contextStories && contextStories.length > 1) {
        throw new Error('Multiple context stories found, skipping');
    } else {
        await createContextStory(story.id, story.full_slug, markdownContent);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Context generated and saved',
      sourceFullSlug: story.full_slug,
      contextFullSlug: contextFullSlug
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    if (error instanceof Error) {
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response(JSON.stringify({
      error: 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function searchForContextStories(contextSlug: string) {
    const searchResponse = await fetch(
        `https://mapi.storyblok.com/v1/spaces/${STORYBLOK_SPACE_ID}/stories?by_slugs=${contextSlug}`,
        {
          headers: {
            'Authorization': STORYBLOK_MANAGEMENT_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      const searchData = await searchResponse.json();

      return searchData.stories;
}

async function createContextStory(
  sourceStoryId: number,
  sourceStorySlug: string,
  markdownContent: string
) {
  const managementToken = STORYBLOK_MANAGEMENT_TOKEN;
  const spaceId = STORYBLOK_SPACE_ID;
  
  const normalizedSlug = sourceStorySlug.replace(/\/$/, '').replace(/\//g, '-');
  const contextSlug = `${normalizedSlug}-context`;

  const createResponse = await fetch(
    `https://mapi.storyblok.com/v1/spaces/${spaceId}/stories`,
    {
      method: 'POST',
      headers: {
        'Authorization': managementToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        story: {
          name: contextSlug,
          slug: contextSlug,
          parent_id: STORYBLOK_LLM_CONTEXTS_FOLDER_ID,
          content: {
            component: 'LLMContext',
            sourceStoryId: sourceStoryId,
            sourceStorySlug: sourceStorySlug,
            markdownContent,
            generatedAt: new Date().toISOString()
          }
        },
        publish: 1
      })
    }
  );

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    throw new Error(`Failed to create context story: ${JSON.stringify(errorData)}`);
  }

  const createData = await createResponse.json();
  return createData.story;
}

async function updateContextStory(
  contextStoryId: number,
  sourceStoryId: number,
  sourceSlug: string,
  markdownContent: string
) {
  const managementToken = STORYBLOK_MANAGEMENT_TOKEN;
  const spaceId = STORYBLOK_SPACE_ID;

  const response = await fetch(
    `https://mapi.storyblok.com/v1/spaces/${spaceId}/stories/${contextStoryId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': managementToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        story: {
          content: {
            component: 'LLMContext',
            sourceStoryId: sourceStoryId,
            sourceStorySlug: sourceSlug,
            markdownContent: markdownContent,
            generatedAt: new Date().toISOString(),
          }
        },
        publish: 1
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update context story: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

async function generateMarkdownContext(url: string): Promise<string> {

    const systemPrompt = await getStoryblokStory<LLMContextStoryblok>('llm-contexts');
    if (!systemPrompt.content.markdownContent) {
      throw new Error('System prompt not found');
    }

  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const userPrompt = `
  The website address for which you are generating the context: ${url}. Visit the website and generate the context.
  `;

  const response = await client.responses.create({
    model: 'gpt-4.1',
    tools: [{ type: "web_search_preview" }],
    input: [
      {
        role: 'system',
        content: systemPrompt.content.markdownContent
      },
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  return response.output_text;
}