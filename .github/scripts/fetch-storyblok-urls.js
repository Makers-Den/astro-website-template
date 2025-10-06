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
    console.log(url);

    const options = {
      followRedirect: true,
      maxRedirects: 5
    };
    
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        console.error(`Following redirect to: ${redirectUrl}`);
        
        https.get(redirectUrl, (redirectRes) => {
          handleResponse(redirectRes, page, allStories, resolve, reject);
        }).on('error', (err) => {
          console.error(`HTTPS Request Error (redirect): ${err.message}`);
          reject(err);
        });
        return;
      }
      
      handleResponse(res, page, allStories, resolve, reject);
    }).on('error', (err) => {
      console.error(`HTTPS Request Error: ${err.message}`);
      reject(err);
    });
  });
}

function handleResponse(res, page, allStories, resolve, reject) {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Log response status and data for debugging
    console.error(`API Response Status: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
      console.error(`API Response: ${data.substring(0, 500)}`);
      reject(new Error(`Storyblok API returned status ${res.statusCode}: ${data.substring(0, 200)}`));
      return;
    }

    if (!data || data.trim() === '') {
      reject(new Error('Empty response from Storyblok API'));
      return;
    }

    try {
      const response = JSON.parse(data);
      
      if (!response.stories) {
        console.error(`Invalid response structure: ${JSON.stringify(response).substring(0, 500)}`);
        reject(new Error('Invalid response from Storyblok API - missing stories array'));
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
      console.error(`JSON Parse Error: ${err.message}`);
      console.error(`Raw data (first 500 chars): ${data.substring(0, 500)}`);
      reject(new Error(`Failed to parse Storyblok API response: ${err.message}`));
    }
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
