# Storyblok TypeScript Type Generator

This tool automatically generates TypeScript type definitions from your Storyblok components, ensuring your types are always in sync with your CMS schema.

## Features

- 🔄 **Automatic Type Generation**: Converts Storyblok component schemas to TypeScript interfaces
- 🎯 **Precise Type Mapping**: Maps all Storyblok field types to appropriate TypeScript types
- 🔗 **Smart Bloks Handling**: Generates union types for restricted bloks fields
- 📦 **Complete Type Coverage**: Includes base types, component types, and story types
- 🚀 **CLI Interface**: Easy-to-use command-line interface
- ⚡ **Fast Execution**: Fetches and generates types in seconds

## Setup

1. **Get your Storyblok Management API token**:

   - Go to your Storyblok space settings
   - Navigate to "Access Tokens"
   - Create a new Management API token with read permissions

2. **Set environment variables**:

   ```bash
   export STORYBLOK_SPACE_ID="188026"
   export STORYBLOK_MANAGEMENT_TOKEN="your-management-token-here"
   ```

   Or create a `.env` file in your project root:

   ```env
   STORYBLOK_SPACE_ID=188026
   STORYBLOK_MANAGEMENT_TOKEN=your-management-token-here
   ```

## Usage

### Quick Start (Recommended)

Generate types in one command:

```bash
npm run storyblok:sync
```

This will:

1. Fetch all components from your Storyblok space
2. Generate TypeScript definitions
3. Save them to `src/types/storyblok.d.ts`

### Individual Commands

**Fetch components only**:

```bash
npm run storyblok:fetch
```

**Generate types from existing components JSON**:

```bash
npm run storyblok:generate
```

### CLI Options

You can also run the CLI directly with custom options:

```bash
# Sync with custom options
node scripts/storyblok-types/cli.js sync --space-id 188026 --token your-token

# Fetch components to custom location
node scripts/storyblok-types/cli.js fetch --output ./custom/path/components.json

# Generate types from custom input
node scripts/storyblok-types/cli.js generate --input ./components.json --output ./types.d.ts
```

## Generated Types

The tool generates comprehensive TypeScript definitions including:

### Component Interfaces

Each Storyblok component becomes a TypeScript interface:

```typescript
export interface HeaderStoryblok {
  _uid: string;
  component: 'header';
  title: string;
  logo?: StoryblokAsset;
  navigation: Array<NavigationItemStoryblok>;
}
```

### Base Types

Common Storyblok types are included:

```typescript
export interface StoryblokAsset {
  id?: number;
  filename: string;
  alt?: string;
  name?: string;
  // ... more properties
}

export interface StoryblokLink {
  id?: string;
  url?: string;
  linktype?: 'story' | 'asset' | 'url' | 'email';
  // ... more properties
}
```

### Union Types

A union of all component types for flexible usage:

```typescript
export type StoryblokComponent = HeaderStoryblok | FooterStoryblok | ArticleStoryblok | ...;
```

### Story Type

Complete story structure with content:

```typescript
export interface StoryblokStory<T = StoryblokComponent> {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  content: T;
  // ... more properties
}
```

## Field Type Mapping

| Storyblok Field | TypeScript Type               | Notes                    |
| --------------- | ----------------------------- | ------------------------ |
| Text            | `string`                      | Single-line text         |
| Textarea        | `string`                      | Multi-line text          |
| Markdown        | `string`                      | Markdown content         |
| Richtext        | `StoryblokRichtext`           | Rich text JSON structure |
| Number          | `number`                      | Numeric values           |
| Boolean         | `boolean`                     | True/false values        |
| Asset           | `StoryblokAsset`              | Single file/image        |
| Multi-asset     | `StoryblokAsset[]`            | Array of files           |
| Option          | `"value1" \| "value2"`        | String literal union     |
| Options         | `Array<"value1" \| "value2">` | Array of string literals |
| Datetime        | `string`                      | ISO date string          |
| Multilink       | `StoryblokLink`               | Link object              |
| Table           | `StoryblokTable`              | Table structure          |
| Bloks           | `StoryblokComponent[]`        | Array of components      |

## Workflow Integration

### Development Workflow

1. Make changes to components in Storyblok
2. Run `npm run storyblok:sync`
3. Your TypeScript types are now updated
4. Use the types in your code with full IntelliSense

### CI/CD Integration

Add the sync command to your build process:

```json
{
  "scripts": {
    "prebuild": "npm run storyblok:sync",
    "build": "astro build"
  }
}
```

## Best Practices

1. **Always regenerate**: Don't manually edit the generated types file
2. **Version control**: Commit the generated types file to track changes
3. **Regular updates**: Run the sync command whenever you modify components
4. **Environment separation**: Use different tokens for development and production
5. **Type safety**: Import specific component types rather than using generic types

## Troubleshooting

### Common Issues

**"STORYBLOK_MANAGEMENT_TOKEN is required"**

- Make sure you've set the environment variable or passed it via CLI flag
- Verify the token has the correct permissions

**"API Error: 401 - Unauthorized"**

- Check that your Management API token is valid
- Ensure the token has access to the specified space

**"Invalid response format"**

- Verify your space ID is correct
- Check that your space has components defined

**"Network Error"**

- Check your internet connection
- Verify Storyblok API is accessible

### Getting Help

If you encounter issues:

1. Check the error message for specific details
2. Verify your environment variables are set correctly
3. Ensure your Storyblok space and tokens are valid
4. Check the generated files for any obvious issues

## File Structure

```
scripts/storyblok-types/
├── cli.js              # Main CLI interface
├── fetch-components.js # Storyblok API integration
├── type-generator.js   # TypeScript generation logic
└── README.md          # This file

src/types/
├── storyblok-components.json # Fetched component schemas
└── storyblok.d.ts           # Generated TypeScript definitions
```
