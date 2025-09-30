#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetches all components from Storyblok Management API
 * @param {string} spaceId - The Storyblok space ID
 * @param {string} token - The Storyblok Management API token
 * @returns {Promise<Array>} Array of component objects
 */
export async function fetchComponents(spaceId, token) {
  try {
    console.log(`Fetching components from Storyblok space ${spaceId}...`);

    const response = await axios.get(`https://mapi.storyblok.com/v1/spaces/${spaceId}/components/`, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.components) {
      console.log(`✅ Successfully fetched ${response.data.components.length} components`);
      return response.data.components;
    } else {
      throw new Error('Invalid response format from Storyblok API');
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error: No response received from Storyblok API');
    } else {
      console.error('❌ Error:', error.message);
    }
    throw error;
  }
}

/**
 * Fetches all datasources from Storyblok Management API
 * @param {string} spaceId - The Storyblok space ID
 * @param {string} token - The Storyblok Management API token
 * @returns {Promise<Array>} Array of datasource objects
 */
export async function fetchDatasources(spaceId, token) {
  try {
    console.log(`Fetching datasources from Storyblok space ${spaceId}...`);

    const response = await axios.get(`https://mapi.storyblok.com/v1/spaces/${spaceId}/datasources/`, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.datasources) {
      console.log(`✅ Successfully fetched ${response.data.datasources.length} datasources`);
      return response.data.datasources;
    } else {
      throw new Error('Invalid response format from Storyblok API for datasources');
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error fetching datasources: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error: No response received from Storyblok API for datasources');
    } else {
      console.error('❌ Error fetching datasources:', error.message);
    }
    throw error;
  }
}

/**
 * Fetches datasource entries for a specific datasource
 * @param {string} spaceId - The Storyblok space ID
 * @param {string} token - The Storyblok Management API token
 * @param {string} datasourceId - The datasource ID
 * @returns {Promise<Array>} Array of datasource entry objects
 */
export async function fetchDatasourceEntries(spaceId, token, datasourceId) {
  try {
    const response = await axios.get(`https://mapi.storyblok.com/v1/spaces/${spaceId}/datasource_entries/`, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      params: {
        datasource_id: datasourceId,
      },
    });

    if (response.data && response.data.datasource_entries) {
      return response.data.datasource_entries;
    } else {
      throw new Error(
        `Invalid response format from Storyblok API for datasource entries of datasource ${datasourceId}`
      );
    }
  } catch (error) {
    if (error.response) {
      console.error(
        `❌ API Error fetching datasource entries for datasource ${datasourceId}: ${error.response.status} - ${error.response.statusText}`
      );
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error(
        `❌ Network Error: No response received from Storyblok API for datasource entries of ${datasourceId}`
      );
    } else {
      console.error(`❌ Error fetching datasource entries for ${datasourceId}:`, error.message);
    }
    throw error;
  }
}

/**
 * Fetches all datasources and their entries from Storyblok Management API
 * @param {string} spaceId - The Storyblok space ID
 * @param {string} token - The Storyblok Management API token
 * @returns {Promise<Object>} Object mapping datasource slugs to their entries
 */
export async function fetchAllDatasourcesWithEntries(spaceId, token) {
  try {
    const datasources = await fetchDatasources(spaceId, token);
    const datasourceMap = {};

    console.log(`Fetching entries for ${datasources.length} datasources...`);

    for (const datasource of datasources) {
      try {
        const entries = await fetchDatasourceEntries(spaceId, token, datasource.id);
        datasourceMap[datasource.slug] = {
          name: datasource.name,
          slug: datasource.slug,
          entries: entries.map((entry) => ({
            name: entry.name,
            value: entry.value,
          })),
        };
        console.log(`✅ Fetched ${entries.length} entries for datasource "${datasource.slug}"`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch entries for datasource "${datasource.slug}":`, error.message);
        // Continue with other datasources if one fails
        datasourceMap[datasource.slug] = {
          name: datasource.name,
          slug: datasource.slug,
          entries: [],
        };
      }
    }

    return datasourceMap;
  } catch (error) {
    console.error('❌ Error fetching datasources with entries:', error.message);
    throw error;
  }
}

/**
 * Saves components data to a JSON file
 * @param {Array} components - Array of component objects
 * @param {string} outputPath - Path to save the JSON file
 */
export async function saveComponentsToFile(components, outputPath) {
  try {
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputPath, JSON.stringify(components, null, 2), 'utf8');

    console.log(`✅ Components saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error saving components to file:', error.message);
    throw error;
  }
}

/**
 * Saves datasources data to a JSON file
 * @param {Object} datasources - Object mapping datasource slugs to their entries
 * @param {string} outputPath - Path to save the JSON file
 */
export async function saveDatasourcesToFile(datasources, outputPath) {
  try {
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputPath, JSON.stringify(datasources, null, 2), 'utf8');

    console.log(`✅ Datasources saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error saving datasources to file:', error.message);
    throw error;
  }
}

/**
 * Main function to fetch and save components
 */
export async function main() {
  const spaceId = process.env.STORYBLOK_SPACE_ID || '188026';
  const token = process.env.STORYBLOK_MANAGEMENT_TOKEN;

  if (!token) {
    console.error('❌ Error: STORYBLOK_MANAGEMENT_TOKEN environment variable is required');
    console.log('Please set your Storyblok Management API token:');
    console.log('export STORYBLOK_MANAGEMENT_TOKEN="your-token-here"');
    process.exit(1);
  }

  try {
    // Fetch components
    const components = await fetchComponents(spaceId, token);
    const componentsOutputPath = path.join(__dirname, `../../src/types/storyblok-components.json`);
    await saveComponentsToFile(components, componentsOutputPath);

    // Fetch datasources with entries
    const datasources = await fetchAllDatasourcesWithEntries(spaceId, token);
    const datasourcesOutputPath = path.join(__dirname, `../../src/types/storyblok-datasources.json`);
    await saveDatasourcesToFile(datasources, datasourcesOutputPath);

    console.log('🎉 Component and datasource fetch completed successfully!');
    return { components, datasources };
  } catch (error) {
    console.error('❌ Failed to fetch components and datasources:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
