#!/usr/bin/env node

/**
 * Fetch published page URLs from Storyblok
 * Usage: STORYBLOK_TOKEN=xxx node fetch-storyblok-urls.js
 */

const STORYBLOK_TOKEN = process.env.STORYBLOK_TOKEN;
const STORYBLOK_VERSION = process.env.STORYBLOK_VERSION || 'published';

if (!STORYBLOK_TOKEN) {
  console.error('Error: STORYBLOK_TOKEN environment variable is required');
  process.exit(1);
}

export const ALL_PAGE_TYPES = ['Page', 'Post'];

async function fetchStoryblokStories(page = 1, contentType) {
  try {
    const url = `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&content_type=${contentType}&version=${STORYBLOK_VERSION}&per_page=100&page=${page}`;
    
    console.error(`Fetching page ${url}...`);
    
    const response = await fetch(url);
    
    console.error(`API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API Response: ${text.substring(0, 500)}`);
      throw new Error(`Storyblok API returned status ${response.status}: ${text.substring(0, 200)}`);
    }
    
    const data = await response.json();
    
    if (!data.stories) {
      console.error(`Invalid response structure: ${JSON.stringify(data).substring(0, 500)}`);
      throw new Error('Invalid response from Storyblok API - missing stories array');
    }
        
    console.error(`Fetched ${data.stories.length} stories`);
    
    // Check if there are more pages
    const total = data.total || 0;
    const perPage = data.perPage || 100;
    const hasMore = page * perPage < total;
    
    if (hasMore) {
      console.error(`More pages available, fetching page ${page + 1}...`);
      return fetchStoryblokStories(page + 1, contentType);
    }
    
    return data.stories;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    throw error;
  }
}

function storyToUrl(story) {
  // Handle home page
  if (story.full_slug === 'home' || story.full_slug === '') {
    return '/';
  }
  
  // Remove trailing slash and add leading slash
  const slug = story.full_slug.replace(/\/$/, '');
  return `/${slug}`;
}

async function main() {
  try {
    console.error('Fetching stories from Storyblok...');
    const allStories = [];
    ALL_PAGE_TYPES.forEach(async (contentType) => {
      const stories = await fetchStoryblokStories(1, contentType);
      allStories.push(...stories);
      console.error(`Total stories fetched: ${stories.length}`);
    });


    // Convert stories to URL paths
    const urls = allStories
      .map(storyToUrl)
      .filter(url => url) // Remove any empty URLs
      .sort(); // Sort for consistency

    console.error(`Generated ${urls.length} URLs`);

    if (urls.length === 0) {
      console.error('Warning: No URLs generated. Check your content type filter.');
      console.error('Falling back to all published stories...');
      
      // Fallback: return all stories as URLs
      const allUrls = allStories
        .map(storyToUrl)
        .filter(url => url)
        .sort();
      
      console.error(`Fallback: Generated ${allUrls.length} URLs from all stories`);
      console.log(JSON.stringify(allUrls, null, 2));
    } else {
      // Output as JSON array
      console.log(JSON.stringify(urls, null, 2));
    }
    
  } catch (error) {
    console.error('Error fetching Storyblok URLs:', error.message);
    process.exit(1);
  }
}

main();
