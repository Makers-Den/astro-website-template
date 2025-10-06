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

async function fetchStoryblokStories(page = 1, allStories, contentType) {
  try {
    const url = `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&content_type=${contentType}&version=${STORYBLOK_VERSION}&per_page=100&page=${page}`;
        
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API Response: ${text.substring(0, 500)}`);
      throw new Error(`Storyblok API returned status ${response.status}}`);
    }
    
    const data = await response.json();
    
    if (!data.stories) {
      console.error(`Invalid response structure: ${JSON.stringify(data).substring(0, 500)}`);
      throw new Error('Invalid response from Storyblok API - missing stories array');
    }

    allStories.push(...data.stories);
        
    
    // Check if there are more pages
    const total = data.total || 0;
    const perPage = data.perPage || 100;
    const hasMore = page * perPage < total;
    
    if (hasMore) {
      return fetchStoryblokStories(page + 1, allStories, contentType);
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
    const allStories = [];

    for (const contentType of ALL_PAGE_TYPES) {
      await fetchStoryblokStories(1, allStories, contentType);
    };

    // Convert stories to URL paths
    const urls = allStories
      .map(storyToUrl)
      .filter(url => url) 
      .sort();

    if (urls.length === 0) {
      throw new Error('No URLs generated. Check your content type filter.');
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
