#!/usr/bin/env node

/**
 * Fetch published page URLs from Storyblok
 * Usage: STORYBLOK_TOKEN=xxx node fetch-storyblok-urls.js
 */

import https from 'https';

const STORYBLOK_TOKEN = process.env.STORYBLOK_TOKEN;
const STORYBLOK_VERSION = process.env.STORYBLOK_VERSION || 'published';

if (!STORYBLOK_TOKEN) {
  console.error('Error: STORYBLOK_TOKEN environment variable is required');
  process.exit(1);
}

function fetchStoryblokStories(page = 1, allStories = []) {
  return new Promise((resolve, reject) => {
    const url = `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&version=${STORYBLOK_VERSION}&per_page=100&page=${page}`;
    
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (!response.stories) {
            reject(new Error('Invalid response from Storyblok API'));
            return;
          }

          const stories = allStories.concat(response.stories);
          
          // Check if there are more pages
          const total = response.total || 0;
          const perPage = response.perPage || 100;
          const hasMore = page * perPage < total;

          if (hasMore) {
            // Recursively fetch next page
            fetchStoryblokStories(page + 1, stories)
              .then(resolve)
              .catch(reject);
          } else {
            resolve(stories);
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
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
    const stories = await fetchStoryblokStories();
    
    // Filter only page content types (adjust based on your content types)
    const pages = stories.filter(story => {
      // Skip drafts if version is published
      if (STORYBLOK_VERSION === 'published' && !story.published) {
        return false;
      }
      
      // Only include page and post content types (adjust to your needs)
      const contentType = story.content?.component;
      return contentType === 'page' || contentType === 'post';
    });

    console.error(`Found ${pages.length} pages`);

    // Convert stories to URL paths
    const urls = pages
      .map(storyToUrl)
      .filter(url => url) // Remove any empty URLs
      .sort(); // Sort for consistency

    // Output as JSON array
    console.log(JSON.stringify(urls, null, 2));
    
  } catch (error) {
    console.error('Error fetching Storyblok URLs:', error.message);
    process.exit(1);
  }
}

main();
