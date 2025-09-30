#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import prettier from 'prettier';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SPACE_ID = '188026';
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'types');
const TYPES_FILE = path.join(OUTPUT_DIR, 'storyblok-generated.ts');

// Type mapping for Storyblok field types to TypeScript types
const TYPE_MAPPINGS = {
  text: 'string',
  textarea: 'string',
  richtext: 'string',
  number: 'number',
  boolean: 'boolean',
  datetime: 'string',
  date: 'string',
  time: 'string',
  asset: 'StoryblokAsset',
  multiasset: 'StoryblokAsset[]',
  bloks: 'StoryblokBlok[]',
  blok: 'StoryblokBlok',
  option: 'string',
  multiselect: 'string[]',
  link: 'StoryblokLink',
  table: 'Record<string, any>',
  custom: 'any',
  markdown: 'string',
  json: 'any',
  color: 'string',
  size: 'string',
  position: 'string',
};

/**
 * Convert a Storyblok field type to TypeScript type
 */
function mapFieldType(field) {
  const { type, source, options, restrict_components } = field;

  if (type === 'bloks') {
    if (source === 'internal_stories') return 'StoryblokStory[]';
    if (restrict_components && restrict_components.length > 0) {
      const componentTypes = restrict_components.map((comp) => `${comp}Component`).join(' | ');
      return `(${componentTypes})[]`;
    }
    return 'StoryblokBlok[]';
  }

  if (type === 'blok') {
    if (source === 'internal_stories') return 'StoryblokStory';
    if (restrict_components && restrict_components.length > 0) {
      return restrict_components.map((comp) => `${comp}Component`).join(' | ');
    }
    return 'StoryblokBlok';
  }

  if (type === 'option' && options?.length > 0) {
    return options.map((opt) => `'${opt.value}'`).join(' | ');
  }

  if (type === 'multiselect' && options?.length > 0) {
    const optionValues = options.map((opt) => `'${opt.value}'`).join(' | ');
    return `(${optionValues})[]`;
  }

  return TYPE_MAPPINGS[type] || 'any';
}

/**
 * Convert component name to valid TypeScript identifier
 */
function toValidTypeScriptIdentifier(name) {
  // Convert spaces and special characters to camelCase
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase()) // Convert spaces to camelCase
    .replace(/^[A-Z]/, (letter) => letter.toLowerCase()) // Ensure first letter is lowercase
    .replace(/^(\d)/, '_$1'); // Handle names starting with numbers
}

/**
 * Generate array string with single quotes to match Prettier config
 */
function generateArrayString(items, indent = 2) {
  const spaces = ' '.repeat(indent);
  const itemStrings = items.map((item) => `${spaces}'${item}'`).join(',\n');
  return `[\n${itemStrings}\n]`;
}

/**
 * Generate TypeScript interface for a component schema
 */
function generateComponentInterface(componentName, schema) {
  const validName = toValidTypeScriptIdentifier(componentName);
  const interfaceName = `${validName.charAt(0).toUpperCase() + validName.slice(1)}Component`;

  let interfaceCode = `\nexport interface ${interfaceName} extends StoryblokBlok {\n`;
  interfaceCode += `  component: '${componentName}';\n`;

  if (schema.schema?.fields) {
    schema.schema.fields.forEach((field) => {
      const fieldName = field.name;
      const fieldType = mapFieldType(field);
      const isRequired = field.required === true;
      const optionalMarker = isRequired ? '' : '?';

      interfaceCode += `  ${fieldName}${optionalMarker}: ${fieldType};\n`;
    });
  }

  interfaceCode += '}\n';
  return interfaceCode;
}

/**
 * Fetch component schemas from Storyblok Management API
 */
async function fetchComponentSchemas() {
  try {
    console.log('🔍 Fetching component schemas from Storyblok Management API...');

    if (!MANAGEMENT_TOKEN) {
      throw new Error('STORYBLOK_MANAGEMENT_TOKEN environment variable is required');
    }

    const [groupsResponse, componentsResponse] = await Promise.all([
      fetch(`https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/component_groups`, {
        headers: {
          Authorization: MANAGEMENT_TOKEN,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/components`, {
        headers: {
          Authorization: MANAGEMENT_TOKEN,
          'Content-Type': 'application/json',
        },
      }),
    ]);

    if (!groupsResponse.ok) {
      throw new Error(`Failed to fetch component groups: ${groupsResponse.status} ${groupsResponse.statusText}`);
    }

    if (!componentsResponse.ok) {
      throw new Error(`Failed to fetch components: ${componentsResponse.status} ${componentsResponse.statusText}`);
    }

    const groups = await groupsResponse.json();
    const components = await componentsResponse.json();

    console.log(`📁 Found ${groups.component_groups?.length || 0} component groups`);
    console.log(`🧩 Found ${components.components?.length || 0} components`);

    return {
      groups: groups.component_groups || [],
      components: components.components || [],
    };
  } catch (error) {
    console.error('❌ Error fetching component schemas:', error.message);
    throw error;
  }
}

/**
 * Generate the complete TypeScript file
 */
function generateTypeScriptFile(components) {
  const baseTypes = `
// =============================================================================
// STORYBLOK GENERATED TYPES
// =============================================================================
// This file is automatically generated from Storyblok component schemas.
// DO NOT EDIT MANUALLY - Run 'npm run generate:storyblok-types' to regenerate.
// Generated on: ${new Date().toISOString()}
// Space ID: ${SPACE_ID}

import type { ISbStoriesParams } from '@storyblok/astro';

// Base Storyblok types
export interface StoryblokAsset {
  alt?: string;
  copyright?: string;
  id: number;
  filename: string;
  name: string;
  title?: string;
  focus?: string;
  fieldtype?: string;
}

export interface StoryblokLink {
  id?: string;
  url?: string;
  linktype?: string;
  cached_url?: string;
  target?: string;
  anchor?: string;
  email?: string;
  story?: {
    id: number;
    name: string;
    slug: string;
    full_slug: string;
  };
}

export interface StoryblokBlok {
  component: string;
  _uid: string;
  [key: string]: any;
}

export interface StoryblokStory {
  id: number;
  name: string;
  slug: string;
  full_slug: string;
  content: Record<string, unknown> & { component?: string };
  created_at: string;
  published_at: string;
  uuid: string;
  is_startpage: boolean;
  parent_id: number | null;
  meta_data: Record<string, unknown>;
  group_id: string;
  first_published_at: string;
  release_id: number | null;
  lang: string;
  path: string;
  alternates: Record<string, unknown>[];
  default_full_slug: string;
  translated_slugs: Record<string, unknown>[];
}

// Component-specific interfaces
`;

  let fileContent = baseTypes;
  const componentNames = [];

  components.forEach((component) => {
    const componentName = component.name;
    componentNames.push(componentName);
    fileContent += generateComponentInterface(componentName, component);
  });

  if (componentNames.length > 0) {
    const interfaceNames = componentNames.map((name) => {
      const validName = toValidTypeScriptIdentifier(name);
      return `${validName.charAt(0).toUpperCase() + validName.slice(1)}Component`;
    });

    fileContent += `\nexport type StoryblokComponent = ${interfaceNames.join(' | ')};\n`;
    fileContent += `\nexport type StoryblokComponentMapping = {\n`;
    componentNames.forEach((name) => {
      const validName = toValidTypeScriptIdentifier(name);
      const interfaceName = `${validName.charAt(0).toUpperCase() + validName.slice(1)}Component`;
      fileContent += `  '${name}': ${interfaceName};\n`;
    });
    fileContent += '};\n';
  }

  fileContent += `
// Utility types and type guards
export type StoryblokContent = {
  component: string;
  [key: string]: any;
};

export type StoryblokBody = StoryblokComponent[];

export function isStoryblokComponent(blok: any): blok is StoryblokComponent {
  return blok && typeof blok.component === 'string' && typeof blok._uid === 'string';
}

export function isStoryblokAsset(asset: any): asset is StoryblokAsset {
  return asset && typeof asset.id === 'number' && typeof asset.filename === 'string';
}

export function isStoryblokLink(link: any): link is StoryblokLink {
  return link && (typeof link.url === 'string' || typeof link.id === 'string');
}

// Component-specific type guards
`;

  componentNames.forEach((componentName) => {
    const validName = toValidTypeScriptIdentifier(componentName);
    const guardName = `is${validName.charAt(0).toUpperCase() + validName.slice(1)}Component`;
    const interfaceName = `${validName.charAt(0).toUpperCase() + validName.slice(1)}Component`;
    fileContent += `export function ${guardName}(blok: any): blok is ${interfaceName} {
  return isStoryblokComponent(blok) && blok.component === '${componentName}';
}\n\n`;
  });

  fileContent += `
// Export all component names for reference
export const STORYBLOK_COMPONENT_NAMES = ${generateArrayString(componentNames)} as const;

export type StoryblokComponentName = typeof STORYBLOK_COMPONENT_NAMES[number];
`;

  return fileContent;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting Storyblok TypeScript type generation...');
    console.log(`📦 Space ID: ${SPACE_ID}`);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    }

    const { components } = await fetchComponentSchemas();
    const typesContent = generateTypeScriptFile(components);

    // Format the generated content with Prettier
    console.log('🎨 Formatting generated types with Prettier...');
    const formattedTypesContent = await prettier.format(typesContent, {
      parser: 'typescript',
      config: path.join(__dirname, '..', '.prettierrc.cjs'),
    });

    fs.writeFileSync(TYPES_FILE, formattedTypesContent);

    console.log(`✅ Successfully generated TypeScript types!`);
    console.log(`📄 Output file: ${TYPES_FILE}`);
    console.log(`🧩 Generated ${components.length} component interfaces`);

    console.log('\n📋 Generated component types:');
    components.forEach((component) => {
      console.log(`  - ${component.name}`);
    });

    console.log('\n🎉 Type generation complete!');
    console.log('💡 You can now import these types in your components:');
    console.log('   import type { StoryblokComponent, HeroComponent } from "@/types/storyblok-generated";');
  } catch (error) {
    console.error('💥 Failed to generate types:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
