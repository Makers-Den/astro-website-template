## Makers’ Den Website – Astro + Storyblok Project Structure Guidelines

This document defines how to structure, name, and organize code in this Astro-based project. Follow these rules strictly to keep the codebase consistent.

### 1) Project Layout and Naming

- **Directories:**

**IMPORTANT:** The structure described below is rigid. This means that you cannot add nested folders unless it is explicitly stated.

- `src/pages/`: Astro routes and API endpoints. Astro routes should only contain dynamic `[...slug].astro` (which resolves Storyblok pages) and `404.astro`. The rest of the routes should be API endpoints.
- `src/components/`: Reusable UI and feature components.
  - `src/components/ui/`: Low-level, reusable presentational components (buttons, text, images, layout primitives). No Storyblok dependency. Nested directories are permitted if necessary.
  - `src/components/metadata/`: Components that output structured data or meta tags (e.g., `JsonLdMetadata.astro`, `OrganizationData.astro`). No direct Storyblok dependency.
  - `src/components/analytics/`: Analytics-only components (e.g., Splitbee, Google Analytics). No direct Storyblok dependency.
  - `src/components/storyblok/`: Components tied to Storyblok content structures.
    - `src/components/storyblok/block-components/`: One component per Storyblok block (e.g., `MakerCard.astro`). Nested directories are permitted if necessary. See "Sections structure" below.
    - `src/components/storyblok/page-components/`: Page-level compositions (e.g., `BlogPostPage.astro`, `PostOverviewPage.astro`).
  - `src/components/navigation/`: Global UI navigation. Nested directories are permitted if necessary.
- `src/layouts/`: Page layouts (e.g., `Layout.astro`).
- `src/utils/`: Pure utilities and framework-agnostic modules.
  - `src/utils/storyblok.ts`: Storyblok helpers, types re-exports, visual editor support.
  - `src/utils/algolia/`: Algolia admin client and indexing helpers.
  - Keep other domains in subfolders (e.g., `images.ts`, `metadata.ts`, `scrollBehavior.ts`).
- `src/types/`: Type declarations (generated Storyblok types, custom types).
- `public/`: Static assets.

- **Naming convention:**

  - Directories: kebab-case
  - Components: `PascalCase.astro` for Astro components.
  - Utilities: `kebab-case.ts`.
  - API endpoints: `kebab-case.ts`.
  - Other files (images, fonts etc.): kebab-case.

- **Imports:** Prefer the `~/` alias to import from `src` (configured in `tsconfig.json` and `astro.config.ts`). The `@/fonts` alias is available for font assets.

### 2) Components: Roles and Boundaries

- **UI components (`src/components/ui/`):**

  - Pure presentational components, no Storyblok awareness, no data fetching.
  - Accept primitive props (strings, numbers, booleans) or generic objects. Keep deterministic rendering.

- **Storyblok block components (`src/components/storyblok/block-components/`):**

  - One component per block type. Name exactly as the Storyblok component with `PascalCase.astro`.
  - Props: `blok` with the exact Storyblok type, and optional layout props like `className`.
  - Use visual editor support: spread `{...makeEditable(blok)}` on the outermost wrapper.
  - In some block components it is necessary to fetch data from `globals/*` like `await getStoryblokStory('globals/testimonials-settings')` but in most cases all of the data comes from the props.
  - If a component is not a Page component but it accepts `blok` as one of the props, it is a Storyblok Block Component and must be placed in `src/components/storyblok/block-components/`.
  - Do NOT place non-Storyblok components here. Pure UI elements belong under `src/components/ui/` and can be imported by block components.
  - Sections structure:
    - Large content sections are grouped under `src/components/storyblok/block-components/sections/`.
    - Inside `sections/`, domain-specific folders are allowed (e.g., `apps-section/`, `cards-section/`, `makers-section/`, `testimonials-section/`).
    - Small, section-specific building blocks (e.g., `AppCard.astro`, `FeatureCard.astro`) live within their section folder when they are tightly coupled to that section.

- **Page components (`src/components/storyblok/page-components/`):**

  - Represent entire pages (e.g., blog post, posts overview). Receive all data from the page route.
  - Keep page-specific logic isolated here (e.g., building breadcrumbs, related posts selection if computed locally from provided data).
  - They should include "Page" suffix in their name.

- **Navigation components:**
  - Reusable across pages. No direct Storyblok calls.

### 3) Conventions and Patterns

- **Type safety:**

  - Always type component props explicitly. Export `Props` interfaces for all Storyblok blocks and sections.
  - Use data guards (`~/utils/type-guards.ts`) when necessary to narrow types at runtime. Create new data guards if necessary.

- **Composition over inheritance:**

  - Keep components small and focused. Prefer composition with `ui` primitives to build complex sections.

  ## Code Style Guidelines

- **Imports**: Use `~/` alias for src imports, organize by external → internal → relative
- **Formatting**: Prettier with 120 char width, 2 spaces, single quotes, trailing commas
- **Types**: Use TypeScript interfaces for props, enable strictNullChecks
- **Error Handling**: Use TypeScript strict mode, prefix unused vars with `_`
- **ESLint**: Follows Astro + TypeScript recommended configs with smart tabs
- **Styles**: Use Tailwind predefined classes. Do not create CSS/SCSS modules.

### 4) Storyblok component registration

- When adding a new Storyblok component, update the `components` map in `astro.config.ts` so the Storyblok integration can resolve it.
- Map the Storyblok component name to the path under `src/components/storyblok/`, for example:
  - `SplitContentSection: 'storyblok/block-components/sections/SplitContentSection'`
  - `Post: 'storyblok/page-components/BlogPostPage'`
- Keep paths stable and follow the directory rules above.

### 5) Quick decision guide (where should this file go?)

- If it renders Storyblok `blok` data: put it in `src/components/storyblok/block-components/` (or a `sections/` subfolder if it is a section or belongs to one).
- If it represents a full page composition for a Storyblok content type: put it in `src/components/storyblok/page-components/` and suffix with `Page`.
- If it is a reusable UI primitive without Storyblok awareness: put it in `src/components/ui/`.
- If it outputs meta or JSON-LD markup: put it in `src/components/metadata/`.
- If it is an analytics integration: put it in `src/components/analytics/`.
- If it is a pure helper function or module: put it in `src/utils/` (or a relevant subfolder like `src/utils/algolia/`).
