# Astro + Storyblok Website Template

A production-ready website template built with [Astro](https://astro.build) and [Storyblok](https://www.storyblok.com/), optimized for [Cloudflare Workers](https://workers.cloudflare.com/) deployment. Built and maintained by [Makers' Den](https://makersden.io).

> **Looking for a team to build your next web project?** [Makers' Den](https://makersden.io) specializes in high-performance websites and web applications. [Get in touch](https://makersden.io).

## Tech Stack

- **Framework**: [Astro](https://astro.build) (v5.7+) with SSR
- **CMS**: [Storyblok](https://www.storyblok.com/) with visual editor support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Type Safety**: TypeScript with strict mode
- **Package Manager**: pnpm

## Key Features

### Storyblok Integration

- Full visual editor support with live preview
- Type-safe component integration with auto-generated TypeScript types
- Custom rich text renderer with `storyblok-rich-text-astro-renderer`
- Resolved relations for complex content structures

### Internationalization (i18n)

- Built-in support for multiple languages (English and German by default)
- Language switcher component with locale-aware routing
- Configured via Astro's native i18n system

### Smart Cache Management

Advanced cache invalidation with Cloudflare integration:

- Webhook-driven automatic cache invalidation on Storyblok publish
- Skips cache purge on first publish to avoid unnecessary operations
- Global cache purge when `global-settings` is updated
- Page-specific cache purge using HTML cache tags for individual pages

### AI-Powered Context Generation

Automatically generates AI-friendly markdown contexts for your pages:

- Triggered by Storyblok webhook on content publish
- Uses OpenAI GPT-4.1 with web search to analyze pages
- Generates structured markdown content for LLM consumption
- System prompt stored in Storyblok for easy management without code changes

### Automated Lighthouse Reports

GitHub Actions workflow for performance monitoring on every PR:

- Deploys preview to Cloudflare Workers
- Runs Lighthouse audits against all Storyblok pages
- Compares PR performance against main branch baseline
- Posts diff report as a sticky PR comment

### Rich Text Rendering

Server-side rich text rendering with full customization:

- Heading hierarchy with auto-generated IDs
- Code syntax highlighting with Prism
- Responsive images with lazy loading
- Custom styled marks and nested lists

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm (enabled via corepack)
- Storyblok account and space
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Makers-Den/astro-website-template.git
cd astro-website-template

# Enable pnpm
corepack enable

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
# Storyblok
STORYBLOK_TOKEN=your_storyblok_token
STORYBLOK_VERSION=draft
STORYBLOK_SPACE_ID=your_space_id
STORYBLOK_MANAGEMENT_TOKEN=your_management_token
STORYBLOK_WEBHOOK_SECRET=your_webhook_secret
STORYBLOK_LLM_CONTEXTS_FOLDER_ID=your_folder_id

# Cloudflare
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_KEY=your_api_key

# OpenAI (for LLM context generation)
OPENAI_API_KEY=your_openai_api_key

# Site
PUBLIC_SITE_URL=http://localhost:3010
PREVIEW_SECRET=your_preview_secret

# Optional: Analytics
COOKIE_CONSENT_ENABLED=true
PUBLIC_GTM_ID=your_gtm_id
PUBLIC_STAPE_URL=your_stape_url
PUBLIC_STAPE_GTM_SCRIPT_LINK=your_script_link
PUBLIC_STAPE_GTM_SCRIPT_ARG=your_script_arg
```

### Development

```bash
# Sync Storyblok types
pnpm run storyblok:sync

# Start development server
pnpm run dev
```

Visit `http://localhost:3010`

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Pure presentational components
│   ├── storyblok/
│   │   ├── block-components/  # Storyblok block components
│   │   ├── page-components/   # Page-level compositions
│   │   └── utils/             # RichTextRenderer, etc.
│   ├── navigation/            # Navigation components
│   ├── metadata/              # SEO & structured data
│   └── analytics/             # Analytics integrations
├── layouts/                   # Page layouts
├── pages/
│   ├── [...slug]/             # Dynamic Storyblok routes
│   ├── api/                   # API endpoints
│   └── 404.astro
├── utils/                     # Helpers and utilities
└── types/                     # TypeScript type declarations
```

## Commands

```bash
# Development
pnpm run dev                    # Start dev server
pnpm run build                  # Production build
pnpm run preview                # Preview production build

# Quality Assurance
pnpm run check                  # Run all checks (astro check + eslint + prettier)
pnpm run fix                    # Auto-fix linting and formatting

# Storyblok Type Generation
pnpm run storyblok:sync         # Fetch and generate types
pnpm run storyblok:fetch        # Fetch schema only
pnpm run storyblok:generate     # Generate types only

# Deployment
pnpm run deploy                 # Deploy to Cloudflare Workers
pnpm run deploy:staging         # Deploy to staging
pnpm run preview:cloudflare     # Local Cloudflare Workers preview
```

## Working with Storyblok

### Adding New Components

1. Create the component in Storyblok's visual editor
2. Sync types: `pnpm run storyblok:sync`
3. Create the Astro component in the appropriate directory:
   - Block components: `src/components/storyblok/block-components/`
   - Page components: `src/components/storyblok/page-components/`
4. Use generated types:

```typescript
import type { YourComponentStoryblok } from '~/types/storyblok';

interface Props {
  blok: YourComponentStoryblok;
}
```

### Visual Editor Support

Enable click-to-edit in Storyblok's visual editor:

```astro
---
import { makeEditable } from '~/utils/storyblokRepository/helpers';
const { blok } = Astro.props;
---

<div {...makeEditable(blok)}>
  <!-- Component content -->
</div>
```

### Adding Languages

1. Update `astro.config.ts` locales array
2. Update `AVAILABLE_LANGUAGES` in `src/utils/storyblokRepository/helpers.ts`
3. Create corresponding content in Storyblok

## API Endpoints

### Cache Invalidation (`/api/invalidate-cache`)

Webhook endpoint for Storyblok to trigger cache invalidation on content publish.

### LLM Context Generation (`/api/llms-context`)

Generates AI-friendly markdown contexts for pages marked with `markdown: true` in Storyblok.

## Deployment

### Cloudflare Workers

```bash
# Login to Cloudflare
wrangler login

# Deploy to production
pnpm run deploy

# Deploy to staging
pnpm run deploy:staging
```

Configure environment-specific settings in `wrangler.toml`.

## Troubleshooting

### Storyblok Types Not Updating

```bash
rm -rf src/types/storyblok*
pnpm run storyblok:sync
```

### Cloudflare Workers Build Errors

Ensure `nodejs_compat` flag is set in `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"]
```

### Cache Not Invalidating

1. Verify webhook is configured correctly in Storyblok
2. Check `STORYBLOK_WEBHOOK_SECRET` matches
3. Verify Cloudflare API credentials

## Contributing

1. Fork the repository
2. Create a feature branch from `main`
3. Follow the coding guidelines in `ai-readme/README.workflow.md`
4. Run `pnpm run check` before committing
5. Submit a PR for review

## License

This project is licensed under the [MIT License](LICENSE).

---

Built with care by [Makers' Den](https://makersden.io) — we build high-performance websites and web applications. [Let's work together](https://makersden.io).
