## Storyblok Integration

This project uses the official `@storyblok/astro` package for fetching content and enabling the visual editor. Prefer it over generic JS SDKs in app code to keep the integration Astro-first and server-friendly. Exception to this rule is rich text rendering which should be handled by `storyblok-rich-text-astro-renderer` package.

### Packages

- **Primary**: `@storyblok/astro`
- **For rich text rendering**: `storyblok-rich-text-astro-renderer`

### Type Generation

Generated Storyblok types live under `src/types/` and are sourced from your space’s component schema and datasources.

- **Commands** (defined in `package.json`):
  - `pnpm run storyblok:sync` — fetches components and generate TypeScript types
  - `pnpm run storyblok:fetch` — fetches component schema and datasources from Storyblok
  - `pnpm run storyblok:generate` — generates TypeScript types into `src/types/storyblok.d.ts`

Typical flow when updating Storyblok components/datasources types:

```bash
pnpm storyblok:sync
```

- Generated artifacts (do not override):

  - `src/types/storyblok.d.ts` — main, typed definitions
  - `src/types/storyblok-components.json` — raw components payload
  - `src/types/storyblok-datasources.json` — raw datasources payload

- Custom helpers: `src/types/storyblok-custom.ts` (can be overwritten)

### Adding new Storyblok Component to the Codebase Guidelines

- Sync Storyblok types with `pnpm storyblok:sync`
- Use `~/types/storyblok.d.ts` for type definitions
- Add component file to the intended location (mentioned in `README.project-structure.md`)
- You can create new directories inside intended location to combine multiple components if they are referring the same context
- Give it the name that appears in `storyblok-components.json` or `~/types/storyblok.d.ts`
- Leverage Storyblok's visual editor with `makeEditable()`
- Update the `components` map in `astro.config.ts` so the Storyblok integration can resolve it.
- Map the Storyblok component name to the path under `src/components/storyblok/`, for example:
  - `SplitContentSection: 'storyblok/block-components/sections/SplitContentSection'`
  - `Post: 'storyblok/page-components/BlogPostPage'`

### Fetching Storyblok Content

- Prefer:
  - using defined `getStoryblokStory`, `getStoryblokStories`, `getStoryblokStoryWithRelations` functions to fetch Storyblok content over creating new functions and using `useStoryblokApi()` directly.
  - `makeEditable()` helper from `~/utils/storyblok` to enable the visual editor over direct `storyblokEditable()` usage.

Example (route or page frontmatter):

```astro
---
import { getStoryblokStoryWithRelations } from '~/utils/storyblok';

const story = await getStoryblokStoryWithRelations('cdn/stories/your-slug', {
  version: 'published',
  resolve_relations: ['FeaturedPosts.posts', 'Post.categories'],
});
---
```

- Centralize shared Storyblok helpers in `~/utils/storyblok` (e.g., `RESOLVED_RELATIONS_ARRAY`, `makeEditable`, image helpers).
- Do not fetch deep inside child components; fetch at the page/route and pass data down.

### Rich Text Rendering

- `storyblok-rich-text-astro-renderer`

  - Pros: component-first, SSR-friendly in Astro, easier custom node/component mapping
  - Usage (simplified):

    ```astro
    ---
    import { RichText } from 'storyblok-rich-text-astro-renderer';

    const content = blok.richtext_field;
    ---

    <RichText content={content} />
    ```

  - You can map Storyblok marks/nodes to custom Astro/HTML elements via the renderer’s options if needed.

### Astro + Storyblok config

- Astro config is located inside `astro.config.ts`. Update it if needed.

### Visual Editor (editable attributes)

- Add editable attributes using:

  ```astro
  ---
  import { makeEditable } from '~/utils/storyblok';
  const { blok } = Astro.props;
  ---

  <div {...makeEditable(blok)}>
    <!-- content -->
  </div>
  ```

- Only apply to elements that represent the Storyblok components (block-components, page-components).
