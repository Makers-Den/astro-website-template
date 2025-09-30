#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Maps Storyblok field types to TypeScript types
 */
const FIELD_TYPE_MAPPING = {
  text: 'string',
  textarea: 'string',
  markdown: 'string',
  richtext: 'StoryblokRichtext',
  number: 'number',
  boolean: 'boolean',
  asset: 'StoryblokAsset',
  multiasset: 'StoryblokAsset[]',
  option: 'string',
  options: 'string[]',
  datetime: 'string',
  multilink: 'StoryblokLink',
  table: 'StoryblokTable',
  bloks: 'StoryblokComponent[]',
  // Additional field types with better defaults
  color: 'string',
  range: 'number',
  image: 'StoryblokAsset',
  file: 'StoryblokAsset',
  email: 'string',
  url: 'string',
  phone: 'string',
  password: 'string',
  search: 'string',
  tel: 'string',
  time: 'string',
  week: 'string',
  month: 'string',
  date: 'string',
  'datetime-local': 'string',
};

/**
 * Field types that should be filtered out (UI-only fields)
 */
const FILTERED_FIELD_TYPES = new Set([
  'section', // UI sections/tabs
  'tab', // UI tabs
]);

/**
 * Checks if a field name represents a Storyblok UI tab
 * @param {string} fieldName - The field name to check
 * @returns {boolean} True if it's a tab field
 */
function isTabField(fieldName) {
  // Tab fields typically have UUID-like patterns: tab_xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx
  return /^tab_[a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12}$/.test(fieldName);
}

/**
 * Converts a Storyblok field name to a valid TypeScript property name
 * @param {string} fieldName - The field name from Storyblok
 * @returns {string} Valid TypeScript property name
 */
function sanitizeFieldName(fieldName) {
  // Replace invalid characters and ensure it starts with a letter or underscore
  return fieldName.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_$&');
}

/**
 * Converts a Storyblok component name to a TypeScript interface name
 * @param {string} componentName - The component name from Storyblok
 * @returns {string} TypeScript interface name
 */
function getInterfaceName(componentName) {
  // Preserve original casing from Storyblok and add Storyblok suffix
  // Handle special characters and ensure consistent naming
  const sanitizedName = componentName
    .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, and hyphens
    .split(/[-_\s]+/)
    .filter((word) => word.length > 0) // Remove empty parts
    .map((word) => {
      // Preserve original casing but ensure it starts with uppercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');

  return `${sanitizedName}Storyblok`;
}

/**
 * Converts a datasource slug to a TypeScript type name
 * @param {string} datasourceSlug - The datasource slug from Storyblok
 * @returns {string} TypeScript type name
 */
function getDatasourceTypeName(datasourceSlug) {
  // Convert slug to PascalCase
  const typeName = datasourceSlug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Return clean type name without suffix for better readability
  return typeName;
}

/**
 * Gets the TypeScript type for a Storyblok field
 * @param {Object} field - The field object from Storyblok schema
 * @param {Object} options - Generation options
 * @param {boolean} options.strictMode - If true, avoid 'unknown' types and use more specific types
 * @param {Object} options.datasources - Datasources mapping for option fields
 * @returns {string} TypeScript type string
 */
function getFieldType(field, options = {}) {
  const { strictMode = false, datasources = {} } = options;
  const fieldType = field.type;

  // Handle bloks field with component restrictions
  if (fieldType === 'bloks') {
    if (field.restrict_components && field.component_whitelist && field.component_whitelist.length > 0) {
      // Create union type of allowed components
      const allowedTypes = field.component_whitelist
        .map((componentName) => getInterfaceName(componentName))
        .join(' | ');
      return `Array<${allowedTypes}>`;
    }
    // If no restrictions, use generic StoryblokComponent array
    return 'StoryblokComponent[]';
  }

  // Handle option field with datasource
  if (fieldType === 'option' && field.datasource_slug && datasources[field.datasource_slug]) {
    const datasource = datasources[field.datasource_slug];
    if (datasource.entries && datasource.entries.length > 0) {
      // Return the type name reference instead of inline union
      return getDatasourceTypeName(field.datasource_slug);
    }
  }

  // Handle relation fields (option fields with internal_stories source)
  if (
    fieldType === 'option' &&
    field.source === 'internal_stories' &&
    field.filter_content_type &&
    field.filter_content_type.length > 0
  ) {
    // Create union type of resolved story types and string
    const resolvedTypes = field.filter_content_type
      .map((contentType) => `StoryblokStory<${getInterfaceName(contentType)}>`)
      .join(' | ');
    return `${resolvedTypes} | string`;
  }

  // Handle option field with specific values
  if (fieldType === 'option' && field.options && field.options.length > 0) {
    const optionValues = field.options.map((option) => `"${option.value}"`).join(' | ');
    return optionValues;
  }

  // Handle multi-options field with datasource
  if (fieldType === 'options' && field.datasource_slug && datasources[field.datasource_slug]) {
    const datasource = datasources[field.datasource_slug];
    if (datasource.entries && datasource.entries.length > 0) {
      // Return array of the type name reference
      return `Array<${getDatasourceTypeName(field.datasource_slug)}>`;
    }
  }

  // Handle multi-options relation fields (options fields with internal_stories source)
  if (
    fieldType === 'options' &&
    field.source === 'internal_stories' &&
    field.filter_content_type &&
    field.filter_content_type.length > 0
  ) {
    // Create array of union types of resolved story types and string
    const resolvedTypes = field.filter_content_type
      .map((contentType) => `StoryblokStory<${getInterfaceName(contentType)}>`)
      .join(' | ');
    return `Array<${resolvedTypes} | string>`;
  }

  // Handle multi-options field with specific values
  if (fieldType === 'options' && field.options && field.options.length > 0) {
    const optionValues = field.options.map((option) => `"${option.value}"`).join(' | ');
    return `Array<${optionValues}>`;
  }

  // Handle text fields with pattern-based detection
  if (fieldType === 'text') {
    const fieldName = field.key || '';
    const description = (field.description || '').toLowerCase();

    // Pattern-based type detection from field names
    if (fieldName.toLowerCase().includes('url') || fieldName.toLowerCase().includes('link')) {
      return 'string';
    }
    if (fieldName.toLowerCase().includes('email')) {
      return 'string';
    }
    if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('tel')) {
      return 'string';
    }
    if (fieldName.toLowerCase().includes('color')) {
      return 'string';
    }
    if (fieldName.toLowerCase().includes('id') && fieldName !== 'id') {
      return 'string';
    }

    // Pattern-based type detection from descriptions
    if (description.includes('url') || description.includes('link')) {
      return 'string';
    }
    if (description.includes('email')) {
      return 'string';
    }
    if (description.includes('phone') || description.includes('telephone')) {
      return 'string';
    }
    if (description.includes('color')) {
      return 'string';
    }
  }

  // Handle number fields with constraints
  if (fieldType === 'number') {
    // Could add min/max constraints in the future
    return 'number';
  }

  // Handle custom fields with specific field_type mapping
  if (fieldType === 'custom') {
    const fieldTypeName = field.field_type || '';

    // Specific custom field type mappings
    const customFieldMappings = {
      'storyblok-tags': 'string[]',
      'color-picker': 'string',
      'date-picker': 'string',
      'datetime-picker': 'string',
      'url-field': 'string',
      'email-field': 'string',
      'phone-field': 'string',
      'json-field': 'Record<string, StoryblokPrimitiveValue>',
      'code-field': 'string',
      'markdown-field': 'string',
      'seo-field': 'Record<string, string>',
      'gallery-field': 'StoryblokAsset[]',
    };

    // Check exact match first
    if (customFieldMappings[fieldTypeName]) {
      return customFieldMappings[fieldTypeName];
    }

    // Try to infer type from field name patterns
    if (fieldTypeName.includes('color')) return 'string';
    if (fieldTypeName.includes('date')) return 'string';
    if (fieldTypeName.includes('url')) return 'string';
    if (fieldTypeName.includes('email')) return 'string';
    if (fieldTypeName.includes('phone')) return 'string';
    if (fieldTypeName.includes('tag')) return 'string[]';
    if (fieldTypeName.includes('json')) return 'Record<string, StoryblokPrimitiveValue>';
    if (fieldTypeName.includes('gallery') || fieldTypeName.includes('image')) return 'StoryblokAsset[]';
    if (fieldTypeName.includes('seo')) return 'Record<string, string>';

    // Default to string for most custom fields (safer than unknown)
    return 'string';
  }

  // Handle plugin fields with specific plugin mapping
  if (fieldType === 'plugin') {
    const pluginName = field.field_type || '';

    // Specific plugin mappings
    const pluginMappings = {
      'seo-metatags': 'Record<string, string>',
      'color-picker': 'string',
      'date-picker': 'string',
      'rich-text-editor': 'StoryblokRichtext',
      'image-optimizer': 'StoryblokAsset',
      'video-player': 'StoryblokAsset',
      'form-builder': 'Record<string, StoryblokPrimitiveValue>',
      'analytics-tracker': 'Record<string, string>',
      'social-share': 'Record<string, string>',
    };

    // Check exact match first
    if (pluginMappings[pluginName]) {
      return pluginMappings[pluginName];
    }

    // Common plugin type patterns
    if (pluginName.includes('seo')) return 'Record<string, string>';
    if (pluginName.includes('color')) return 'string';
    if (pluginName.includes('date')) return 'string';
    if (pluginName.includes('rich') || pluginName.includes('editor')) return 'StoryblokRichtext';
    if (pluginName.includes('image') || pluginName.includes('media')) return 'StoryblokAsset';
    if (pluginName.includes('form')) return 'Record<string, StoryblokPrimitiveValue>';
    if (pluginName.includes('analytics') || pluginName.includes('tracking')) return 'Record<string, string>';

    // Default to string for most plugins (safer than unknown)
    return 'string';
  }

  // Use default mapping with strict mode consideration
  const defaultType = FIELD_TYPE_MAPPING[fieldType];
  if (defaultType) {
    return defaultType;
  }

  // In strict mode, try to infer a more specific type
  if (strictMode) {
    // If field name suggests a specific type
    const fieldName = field.key || '';
    if (fieldName.toLowerCase().includes('count') || fieldName.toLowerCase().includes('number')) {
      return 'number';
    }
    if (fieldName.toLowerCase().includes('enabled') || fieldName.toLowerCase().includes('visible')) {
      return 'boolean';
    }
    if (fieldName.toLowerCase().includes('list') || fieldName.toLowerCase().includes('array')) {
      return 'string[]';
    }
    // Default to string in strict mode (most fields are strings)
    return 'string';
  }

  // Fallback to unknown for better type safety than any
  return 'unknown';
}

/**
 * Generates TypeScript interface for a Storyblok component
 * @param {Object} component - The component object from Storyblok
 * @param {Object} options - Generation options
 * @returns {string} TypeScript interface definition
 */
function generateInterface(component, options = {}) {
  const interfaceName = getInterfaceName(component.name);
  const fields = component.schema || {};

  // Add JSDoc comment for the component
  let interfaceContent = `/**\n * Storyblok component: ${component.name}\n`;
  if (component.display_name && component.display_name !== component.name) {
    interfaceContent += ` * Display name: ${component.display_name}\n`;
  }
  interfaceContent += ` */\n`;

  interfaceContent += `export interface ${interfaceName} {\n`;

  // Add base Storyblok properties
  interfaceContent += `  /** Unique identifier for the component instance */\n`;
  interfaceContent += `  _uid: string;\n`;
  interfaceContent += `  /** Component type identifier */\n`;
  interfaceContent += `  component: "${component.name}";\n`;
  // Add optional _editable field for Visual Editor support
  interfaceContent += `  /** Visual editor inline HTML for editing */\n`;
  interfaceContent += `  _editable?: string;\n`;

  // Add component-specific fields (sorted alphabetically)
  Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically by field name
    .forEach(([fieldName, field]) => {
      // Skip UI-only fields (sections, tabs, etc.)
      if (FILTERED_FIELD_TYPES.has(field.type) || isTabField(fieldName)) {
        return;
      }

      const sanitizedName = sanitizeFieldName(fieldName);
      const fieldType = getFieldType(field, options);

      // Determine if field should be optional
      // In Storyblok, fields are optional by default unless explicitly marked as required
      let isRequired = field.required === true;

      const optional = isRequired ? '' : '?';

      // Add JSDoc comment with field information
      let fieldComment = '';
      if (field.description) {
        fieldComment += field.description;
      }
      if (field.type && field.type !== 'text') {
        fieldComment += fieldComment ? ` (${field.type})` : `Field type: ${field.type}`;
      }
      if (fieldComment) {
        interfaceContent += `  /** ${fieldComment} */\n`;
      }

      interfaceContent += `  ${sanitizedName}${optional}: ${fieldType};\n`;
    });

  interfaceContent += `}\n`;

  return interfaceContent;
}

/**
 * Generates base TypeScript types used by Storyblok components
 * @param {Object} datasources - Datasources mapping for generating enum types
 * @returns {string} Base type definitions
 */
function generateBaseTypes(datasources = {}) {
  let baseTypes = `// Base Storyblok types

/**
 * Common value types used in Storyblok
 */
export type StoryblokPrimitiveValue = string | number | boolean | null;
export type StoryblokMetadataValue = StoryblokPrimitiveValue | StoryblokPrimitiveValue[] | Record<string, StoryblokPrimitiveValue>;

/**
 * Storyblok rich text node attributes
 */
export interface StoryblokRichtextAttrs {
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  /** Link URL (for link nodes) */
  href?: string;
  /** Link target */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** HTML class names */
  class?: string;
  /** Anchor ID */
  id?: string;
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Font size */
  fontSize?: string;
  /** Custom attributes */
  [key: string]: StoryblokPrimitiveValue;
}

/**
 * Storyblok rich text mark attributes
 */
export interface StoryblokRichtextMarkAttrs {
  /** Link URL (for link marks) */
  href?: string;
  /** Link target */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** Text color */
  color?: string;
  /** Custom attributes */
  [key: string]: StoryblokPrimitiveValue;
}

/**
 * Storyblok asset (image, video, document, etc.)
 */
export interface StoryblokAsset {
  /** Asset ID */
  id?: number;
  /** Asset filename/URL */
  filename: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Asset name */
  name?: string;
  /** Focus point for cropping (e.g., "100x100:200x200") */
  focus?: string;
  /** Asset title */
  title?: string;
  /** Copyright information */
  copyright?: string;
  /** Asset metadata */
  meta_data?: Record<string, StoryblokMetadataValue>;
}

/**
 * Storyblok link field (internal links, external URLs, etc.)
 */
export interface StoryblokLink {
  /** Link ID */
  id?: string;
  /** Link URL */
  url?: string;
  /** Type of link */
  linktype?: 'story' | 'asset' | 'url' | 'email';
  /** Field type identifier */
  fieldtype?: string;
  /** Cached URL for internal links */
  cached_url?: string;
  /** Linked story information (for internal links) */
  story?: {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    full_slug: string;
    url: string;
  };
}

/**
 * Storyblok rich text content (structured text with formatting)
 */
export interface StoryblokRichtext {
  /** Node type (e.g., 'doc', 'paragraph', 'text') */
  type: string;
  /** Child nodes */
  content?: StoryblokRichtext[];
  /** Text formatting marks */
  marks?: Array<{
    type: string;
    attrs?: StoryblokRichtextMarkAttrs;
  }>;
  /** Node attributes */
  attrs?: StoryblokRichtextAttrs;
  /** Text content (for text nodes) */
  text?: string;
}

/**
 * Storyblok table field
 */
export interface StoryblokTable {
  /** Table header */
  thead: Array<{
    _uid: string;
    value: string;
  }>;
  /** Table body */
  tbody: Array<{
    _uid: string;
    body: Array<{
      _uid: string;
      value: string;
    }>;
  }>;
}

// Utility types

/**
 * Extract component type from a Storyblok component
 */
export type StoryblokComponentType<T> = T extends { component: infer C } ? C : never;

/**
 * Filter components by type
 */
export type StoryblokComponentByType<T, K extends string> = T extends { component: K } ? T : never;

/**
 * Make all properties of a Storyblok component optional (useful for partial updates)
 */
export type PartialStoryblokComponent<T> = Partial<Omit<T, '_uid' | 'component'>> & Pick<T, '_uid' | 'component'>;

`;

  // Generate datasource-based enum types
  if (Object.keys(datasources).length > 0) {
    baseTypes += `// Datasource-based types\n\n`;

    Object.entries(datasources).forEach(([slug, datasource]) => {
      if (datasource.entries && datasource.entries.length > 0) {
        const typeName = getDatasourceTypeName(slug);
        const values = datasource.entries.map((entry) => `'${entry.value}'`).join(' | ');
        baseTypes += `/**\n * Options for ${datasource.name} datasource\n */\n`;
        baseTypes += `export type ${typeName} = ${values};\n\n`;
      }
    });
  }

  return baseTypes;
}

/**
 * Groups components by category for better organization
 * @param {Array} components - Array of component objects
 * @returns {Object} Object with component groups
 */
function groupComponents(components) {
  // Group components based on naming patterns and metadata
  const groups = {
    layout: [],
    content: [],
    ui: [],
    form: [],
    media: [],
    other: [],
  };

  components.forEach((component) => {
    const name = component.name.toLowerCase();

    // Determine component category based on name patterns and metadata
    if (name.includes('section') || name.includes('page') || name.includes('layout')) {
      groups.layout.push(component);
    } else if (name.includes('text') || name.includes('rich') || name.includes('content')) {
      groups.content.push(component);
    } else if (name.includes('card') || name.includes('button') || name.includes('link') || name.includes('tag')) {
      groups.ui.push(component);
    } else if (name.includes('form') || name.includes('input') || name.includes('field')) {
      groups.form.push(component);
    } else if (name.includes('image') || name.includes('video') || name.includes('media') || name.includes('asset')) {
      groups.media.push(component);
    } else {
      groups.other.push(component);
    }
  });

  return groups;
}

/**
 * Loads datasources from the datasources JSON file
 * @param {string} datasourcesPath - Path to the datasources JSON file
 * @returns {Promise<Object>} Datasources object
 */
async function loadDatasources(datasourcesPath) {
  try {
    const datasourcesContent = await fs.readFile(datasourcesPath, 'utf8');
    return JSON.parse(datasourcesContent);
  } catch (error) {
    console.warn(`⚠️ Could not load datasources from ${datasourcesPath}:`, error.message);
    console.warn('Continuing without datasource-based types...');
    return {};
  }
}

/**
 * Generates TypeScript definitions from Storyblok components
 * @param {Array} components - Array of component objects from Storyblok
 * @param {Object} options - Generation options
 * @param {boolean} options.strictMode - If true, avoid 'unknown' types and use more specific types
 * @param {Object} options.datasources - Datasources mapping for option fields
 * @returns {string} Complete TypeScript definition file content
 */
export function generateTypeDefinitions(components, options = {}) {
  const { datasources = {} } = options;

  let output = `// Auto-generated Storyblok component types
// Do not edit this file manually - it will be overwritten
// Generated on: ${new Date().toISOString()}
// Total components: ${components.length}

`;

  // Add base types (including datasource-based types)
  output += generateBaseTypes(datasources);

  // Group components for better organization
  const groupedComponents = groupComponents(components);

  // Generate interfaces for each component group
  Object.entries(groupedComponents).forEach(([groupName, groupComponents]) => {
    if (groupComponents.length === 0) return;

    output += `// ${groupName.charAt(0).toUpperCase() + groupName.slice(1)} Components\n\n`;

    const interfaces = groupComponents.map((component) => generateInterface(component, options));
    output += interfaces.join('\n');
    output += '\n';
  });

  // Generate union types by category
  Object.entries(groupedComponents).forEach(([groupName, groupComponents]) => {
    if (groupComponents.length === 0) return;

    const componentNames = groupComponents.map((component) => getInterfaceName(component.name));
    const typeName = `Storyblok${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Component`;

    output += `/** Union type for ${groupName} components */\n`;
    output += `export type ${typeName} = ${componentNames.join(' | ')};\n\n`;
  });

  // Generate main union type of all components
  const allComponentNames = components.map((component) => getInterfaceName(component.name));
  output += `/** Union type of all Storyblok components */\n`;
  output += `export type StoryblokComponent = ${allComponentNames.join(' | ')};\n\n`;

  // Generate story content type
  output += `/**\n * Storyblok story object structure\n */\n`;
  output += `export interface StoryblokStory<T = StoryblokComponent> {\n`;
  output += `  /** Story ID */\n`;
  output += `  id: number;\n`;
  output += `  /** Story UUID */\n`;
  output += `  uuid: string;\n`;
  output += `  /** Story name */\n`;
  output += `  name: string;\n`;
  output += `  /** Story slug */\n`;
  output += `  slug: string;\n`;
  output += `  /** Full slug path */\n`;
  output += `  full_slug: string;\n`;
  output += `  /** Creation timestamp */\n`;
  output += `  created_at: string;\n`;
  output += `  /** Publication timestamp */\n`;
  output += `  published_at: string;\n`;
  output += `  /** First publication timestamp */\n`;
  output += `  first_published_at: string;\n`;
  output += `  /** Story content */\n`;
  output += `  content: T;\n`;
  output += `  /** Whether this is the start page */\n`;
  output += `  is_startpage: boolean;\n`;
  output += `  /** Parent story ID */\n`;
  output += `  parent_id: number | null;\n`;
  output += `  /** Story group ID */\n`;
  output += `  group_id: string;\n`;
  output += `  /** Story position */\n`;
  output += `  position: number;\n`;
  output += `  /** Story tags */\n`;
  output += `  tag_list: string[];\n`;
  output += `  /** Story language */\n`;
  output += `  lang: string;\n`;
  output += `  /** Story path */\n`;
  output += `  path: string;\n`;
  output += `  /** Alternative language versions */\n`;
  output += `  alternates: Array<{\n`;
  output += `    id: number;\n`;
  output += `    name: string;\n`;
  output += `    slug: string;\n`;
  output += `    published: boolean;\n`;
  output += `    full_slug: string;\n`;
  output += `    is_folder: boolean;\n`;
  output += `  }>;\n`;
  output += `  /** Translated slugs */\n`;
  output += `  translated_slugs: Array<{\n`;
  output += `    path: string;\n`;
  output += `    name: string;\n`;
  output += `    lang: string;\n`;
  output += `  }>;\n`;
  output += `}\n`;

  return output;
}

/**
 * Saves TypeScript definitions to a file
 * @param {string} content - TypeScript definition content
 * @param {string} outputPath - Path to save the .d.ts file
 */
export async function saveTypeDefinitions(content, outputPath) {
  try {
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`✅ TypeScript definitions saved to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error saving type definitions:', error.message);
    throw error;
  }
}

/**
 * Main function to generate types from components JSON
 * @param {string} componentsJsonPath - Path to the components JSON file
 * @param {string} outputPath - Path to save the TypeScript definitions
 * @param {string} datasourcesJsonPath - Path to the datasources JSON file (optional)
 */
export async function generateTypesFromJson(componentsJsonPath, outputPath, datasourcesJsonPath = null) {
  try {
    console.log(`Reading components from ${componentsJsonPath}...`);
    const jsonContent = await fs.readFile(componentsJsonPath, 'utf8');
    const components = JSON.parse(jsonContent);

    // Load datasources if path is provided
    let datasources = {};
    if (datasourcesJsonPath) {
      datasources = await loadDatasources(datasourcesJsonPath);
      console.log(`Loaded ${Object.keys(datasources).length} datasources for enhanced type generation`);
    }

    console.log(`Generating TypeScript definitions for ${components.length} components...`);
    const typeDefinitions = generateTypeDefinitions(components, { datasources });

    await saveTypeDefinitions(typeDefinitions, outputPath);
    console.log('🎉 Type generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating types:', error.message);
    throw error;
  }
}
