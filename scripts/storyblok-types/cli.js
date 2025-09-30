#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchComponents,
  saveComponentsToFile,
  fetchAllDatasourcesWithEntries,
  saveDatasourcesToFile,
} from './fetch-components.js';
import { generateTypesFromJson } from './type-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const program = new Command();

program.name('storyblok-types').description('Generate TypeScript types from Storyblok components').version('1.0.0');

program
  .command('fetch')
  .description('Fetch components and datasources from Storyblok')
  .option('-s, --space-id <spaceId>', 'Storyblok space ID', process.env.STORYBLOK_SPACE_ID || '188026')
  .option('-t, --token <token>', 'Storyblok Management API token', process.env.STORYBLOK_MANAGEMENT_TOKEN)
  .option(
    '--components-output <path>',
    'Output path for components JSON',
    path.join(__dirname, '../../src/types/storyblok-components.json')
  )
  .option(
    '--datasources-output <path>',
    'Output path for datasources JSON',
    path.join(__dirname, '../../src/types/storyblok-datasources.json')
  )
  .action(async (options) => {
    if (!options.token) {
      console.error('❌ Error: Storyblok Management API token is required');
      console.log('Set it via --token flag or STORYBLOK_MANAGEMENT_TOKEN environment variable');
      process.exit(1);
    }

    try {
      // Fetch components
      const components = await fetchComponents(options.spaceId, options.token);
      await saveComponentsToFile(components, options.componentsOutput);

      // Fetch datasources with entries
      const datasources = await fetchAllDatasourcesWithEntries(options.spaceId, options.token);
      await saveDatasourcesToFile(datasources, options.datasourcesOutput);

      console.log('🎉 Components and datasources fetch completed successfully!');
    } catch (error) {
      console.error('❌ Failed to fetch components and datasources:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate TypeScript types from components JSON')
  .option(
    '-i, --input <path>',
    'Input path for components JSON',
    path.join(__dirname, '../../src/types/storyblok-components.json')
  )
  .option(
    '-o, --output <path>',
    'Output path for TypeScript definitions',
    path.join(__dirname, '../../src/types/storyblok.d.ts')
  )
  .option(
    '--datasources <path>',
    'Input path for datasources JSON (optional)',
    path.join(__dirname, '../../src/types/storyblok-datasources.json')
  )
  .action(async (options) => {
    try {
      await generateTypesFromJson(options.input, options.output, options.datasources);
    } catch (error) {
      console.error('❌ Failed to generate types:', error.message);
      process.exit(1);
    }
  });

program
  .command('sync')
  .description('Fetch components and datasources, then generate types in one command')
  .option('-s, --space-id <spaceId>', 'Storyblok space ID', process.env.STORYBLOK_SPACE_ID || '188026')
  .option('-t, --token <token>', 'Storyblok Management API token', process.env.STORYBLOK_MANAGEMENT_TOKEN)
  .option(
    '--components-output <path>',
    'Output path for components JSON',
    path.join(__dirname, '../../src/types/storyblok-components.json')
  )
  .option(
    '--datasources-output <path>',
    'Output path for datasources JSON',
    path.join(__dirname, '../../src/types/storyblok-datasources.json')
  )
  .option(
    '--types-output <path>',
    'Output path for TypeScript definitions',
    path.join(__dirname, '../../src/types/storyblok.d.ts')
  )
  .action(async (options) => {
    if (!options.token) {
      console.error('❌ Error: Storyblok Management API token is required');
      console.log('Set it via --token flag or STORYBLOK_MANAGEMENT_TOKEN environment variable');
      process.exit(1);
    }

    try {
      console.log('🚀 Starting Storyblok types sync...\n');

      // Step 1: Fetch components
      console.log('Step 1: Fetching components from Storyblok...');
      const components = await fetchComponents(options.spaceId, options.token);
      await saveComponentsToFile(components, options.componentsOutput);

      // Step 2: Fetch datasources with entries
      console.log('\nStep 2: Fetching datasources from Storyblok...');
      const datasources = await fetchAllDatasourcesWithEntries(options.spaceId, options.token);
      await saveDatasourcesToFile(datasources, options.datasourcesOutput);

      console.log('\nStep 3: Generating TypeScript definitions...');
      await generateTypesFromJson(options.componentsOutput, options.typesOutput, options.datasourcesOutput);

      console.log('\n🎉 Storyblok types sync completed successfully!');
      console.log(`📁 Components JSON: ${options.componentsOutput}`);
      console.log(`📁 Datasources JSON: ${options.datasourcesOutput}`);
      console.log(`📁 TypeScript definitions: ${options.typesOutput}`);
    } catch (error) {
      console.error('❌ Failed to sync types:', error.message);
      process.exit(1);
    }
  });

program.parse();
