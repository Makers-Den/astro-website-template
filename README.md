# Astro Website Template with Storyblok CMS

A modern, production-ready website template built with Astro and Storyblok CMS, optimized for Cloudflare Workers deployment.

## 🚀 Tech Stack

- **Framework**: [Astro](https://astro.build) (v5.7+) with SSR (Server-Side Rendering)
- **CMS**: [Storyblok](https://www.storyblok.com/) with visual editor support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Type Safety**: TypeScript with strict mode
- **Package Manager**: pnpm

## ✨ Key Features

### 🎨 Storyblok Integration

- Full visual editor support with live preview
- Type-safe Storyblok component integration
- Automatic TypeScript type generation from Storyblok schema
- Custom rich text renderer with `storyblok-rich-text-astro-renderer`
- Resolved relations for complex content structures

### 🌍 Internationalization (i18n)

- Built-in i18n support for multiple languages (English and German by default)
- Language switcher component with locale-aware routing
- Configured via Astro's native i18n configuration
- Available languages defined in: `src/utils/storyblokRepository/helpers.ts`

```typescript
export const AVAILABLE_LANGUAGES = ['en', 'de'];
```

### ⚡ Smart Cache Management

Advanced cache invalidation system with Cloudflare integration:

- **Webhook-driven**: Automatic cache invalidation on Storyblok content publish
- **Intelligent behavior**: Skips cache purge on first publish to avoid unnecessary operations
- **Granular control**:
  - Global cache purge when `global-settings` is updated
  - Page-specific cache purge using HTML cache tags for individual pages
- **Implementation**: See `src/pages/api/invalidate-cache.ts`

```typescript
// Example: Tag-based cache invalidation
const tagToPurge = `html:${hostname}/${story.full_slug}`;
await purgeCloudflareCache({ tags: [tagToPurge] });
```

### 🤖 AI-Powered Context Generation

**LLM Context Endpoint** (`src/pages/api/llms-context.ts`):

Automatically generates and stores AI-friendly markdown contexts for your web pages:

- **Triggered by**: Storyblok webhook on content publish
- **Process**:
  1. Detects pages marked for markdown generation
  2. Uses OpenAI GPT-4.1 with web search to visit and analyze the page
  3. Generates structured markdown content based on a system prompt
  4. Stores the context in a dedicated Storyblok folder
- **Smart prompting**: System prompt is stored in Storyblok (`llm-contexts` story) for easy management without code changes
- **Auto-update**: Updates existing contexts or creates new ones as needed

**Benefits**: Makes your content easily consumable by LLMs and other AI tools while maintaining a single source of truth in Storyblok.

### 📝 Rich Text Rendering

Uses `storyblok-rich-text-astro-renderer` for server-side rich text rendering:

- **Custom schema**: Tailored marks and nodes for your design system
- **Component integration**: Supports embedded Storyblok components in rich text
- **Styling**: Includes custom Typography components, code blocks, and semantic HTML
- **Implementation**: See `src/components/storyblok/utils/RichTextRenderer.astro`

Features:

- Heading hierarchy with auto-generated IDs
- Code syntax highlighting with Prism
- Responsive images with lazy loading
- Custom styled marks (subscript, superscript, quotes)
- Nested lists and blockquotes

### 🏗️ Cloudflare Workers Configuration

Optimized for edge deployment with Cloudflare Workers:

- **SSR on the edge**: Server-side rendering at 300+ locations worldwide
- **Image optimization**: Cloudflare image service integration
- **Platform proxy**: Local development with Cloudflare bindings
- **Version metadata**: Deployment version tracking
- **Configuration**: `wrangler.toml` with environment-specific settings

```toml
# wrangler.toml
output = "server"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
```

**Deployment commands**:

```bash
pnpm run deploy              # Production deployment
pnpm run deploy:staging      # Staging environment
pnpm run preview:cloudflare  # Local preview with Wrangler
```

### 🔬 Automated Lighthouse Reports

GitHub Actions workflow for performance monitoring:

- **Trigger**: Runs on every pull request (opened, synchronized, reopened)
- **Process**:
  1. Deploys preview to Cloudflare Workers with branch-based URL
  2. Fetches all URLs from Storyblok for comprehensive testing
  3. Runs Lighthouse audits on preview deployment
  4. Downloads baseline metrics from main branch
  5. Generates diff report comparing PR vs main
  6. Posts results as sticky PR comment
- **Configuration**: `.github/workflows/lighthouse-pr.yml`
- **Benefits**: Catch performance regressions before merging

The workflow automatically fetches test URLs from Storyblok, ensuring all pages are audited.

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/                    # Pure presentational components
│   │   ├── storyblok/
│   │   │   ├── block-components/  # Storyblok block components
│   │   │   ├── page-components/   # Page-level compositions
│   │   │   └── utils/            # RichTextRenderer, etc.
│   │   ├── navigation/           # Navigation components
│   │   ├── metadata/             # SEO & structured data
│   │   └── analytics/            # Analytics integrations
│   ├── layouts/                  # Page layouts
│   ├── pages/
│   │   ├── [...slug]/           # Dynamic Storyblok routes
│   │   ├── api/                 # API endpoints
│   │   │   ├── invalidate-cache.ts
│   │   │   └── llms-context.ts
│   │   └── 404.astro
│   ├── utils/
│   │   ├── storyblokRepository/ # Storyblok helpers
│   │   └── ...                  # Other utilities
│   └── types/
│       ├── storyblok.d.ts       # Generated types (DO NOT EDIT)
│       ├── storyblok-components.json
│       └── storyblok-custom.ts
├── scripts/
│   └── storyblok-types/         # Type generation scripts
├── ai-readme/                   # AI agent guidelines
│   ├── README.project-structure.md
│   ├── README.storyblok-integration.md
│   └── README.workflow.md
├── astro.config.ts
├── wrangler.toml
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm (enabled via corepack)
- Storyblok account and space
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd astro-website-template
```

2. **Enable pnpm**:

```bash
corepack enable
```

3. **Install dependencies**:

```bash
pnpm install
```

4. **Set up environment variables**:

Create a `.env` file with the following variables:

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

5. **Sync Storyblok types**:

```bash
pnpm run storyblok:sync
```

6. **Start development server**:

```bash
pnpm run dev
```

Visit `http://localhost:3010`

## 🛠️ Development Workflow

### Core Commands

```bash
# Development
pnpm run dev                    # Start dev server
pnpm run build                  # Production build
pnpm run preview                # Preview production build

# Quality Assurance (MANDATORY before committing)
pnpm run check                  # Run all checks
pnpm run fix                    # Auto-fix linting and formatting

# Storyblok Type Generation
pnpm run storyblok:sync         # Fetch and generate types
pnpm run storyblok:fetch        # Fetch schema only
pnpm run storyblok:generate     # Generate types only

# Cloudflare Deployment
pnpm run deploy                 # Deploy to production
pnpm run deploy:staging         # Deploy to staging
pnpm run preview:cloudflare     # Local Cloudflare preview
```

### Quality Checks

**All checks must pass before committing!**

The `pnpm run check` command runs:

- TypeScript validation (`astro check`)
- ESLint for code quality
- Prettier for formatting

**Auto-fix** most issues with:

```bash
pnpm run fix
```

## 🎨 Working with Storyblok

### Adding New Components

1. **Create the component** in Storyblok's visual editor
2. **Sync types** to your local environment:
   ```bash
   pnpm run storyblok:sync
   ```
3. **Create the Astro component**:
   - Block components: `src/components/storyblok/block-components/YourComponent.astro`
   - Page components: `src/components/storyblok/page-components/YourPageComponent.astro`
4. **No need to register components in `astro.config.ts` since @storyblok/astro 7.3.0**:
5. **Use TypeScript types**:

   ```typescript
   import type { YourComponentStoryblok } from '~/types/storyblok';

   interface Props {
     blok: YourComponentStoryblok;
   }
   ```

### Rich Text Rendering

```astro
---
import RichTextRenderer from '~/components/storyblok/utils/RichTextRenderer.astro';
import type { StoryblokRichtext } from '~/types/storyblok';

interface Props {
  content: StoryblokRichtext;
}

const { content } = Astro.props;
---

<RichTextRenderer content={content} variant="body" />
```

### Visual Editor Support

Enable click-to-edit in Storyblok's visual editor:

```astro
---
import { makeEditable } from '~/utils/storyblokRepository/helpers';

interface Props {
  blok: YourComponentStoryblok;
}

const { blok } = Astro.props;
---

<div {...makeEditable(blok)}>
  <!-- Component content -->
</div>
```

## 🌐 Internationalization

### Configuration

i18n is configured in `astro.config.ts`:

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'de'],
}
```

### Adding Languages

1. Update `astro.config.ts`:
   ```typescript
   locales: ['en', 'de', 'fr'], // Add 'fr'
   ```
2. Update `src/utils/storyblokRepository/helpers.ts`:
   ```typescript
   export const AVAILABLE_LANGUAGES = ['en', 'de', 'fr'];
   ```
3. Create corresponding content in Storyblok

### Using Locales

```astro
---
const currentLocale = Astro.currentLocale; // 'en' | 'de'
---
```

The locale switcher component automatically handles routing between languages.

## 🔧 API Endpoints

### Cache Invalidation

**Endpoint**: `/api/invalidate-cache`

Webhook endpoint for Storyblok to trigger cache invalidation.

**Setup**:

1. Go to Storyblok Settings → Webhooks
2. Create a webhook pointing to: `https://your-domain.com/api/invalidate-cache?secret=YOUR_WEBHOOK_SECRET`
3. Trigger on: "Story published"

**Behavior**:

- Skips cache invalidation on first publish
- Purges all cache when `global-settings` is updated
- Purges specific page cache for other content updates

### LLM Context Generation

**Endpoint**: `/api/llms-context`

Automatically generates AI-friendly markdown contexts for your pages.

**Setup**:

1. Create an `LLMContext` component in Storyblok with fields:
   - `sourceStoryId` (number)
   - `sourceStorySlug` (text)
   - `markdownContent` (textarea)
   - `generatedAt` (datetime)
2. Create a folder in Storyblok for contexts and note its ID
3. Create a story at `llm-contexts` with your system prompt in the `markdownContent` field
4. Set `STORYBLOK_LLM_CONTEXTS_FOLDER_ID` in your environment
5. Add a field `markdown` (boolean) to your page components to enable context generation
6. Create a webhook pointing to: `https://your-domain.com/api/llms-context?secret=YOUR_WEBHOOK_SECRET`
7. Trigger on: "Story published"

**How it works**:

- Webhook triggers on content publish
- Checks if page has `markdown: true`
- Fetches system prompt from Storyblok
- Uses OpenAI to generate markdown context by visiting the live page
- Stores/updates context in Storyblok folder

**Why store prompts in Storyblok?**

- No code deployment needed for prompt changes
- Content team can refine prompts
- Version history via Storyblok
- Easy A/B testing of different prompts

## 🚢 Deployment

### Cloudflare Workers (Recommended)

1. **Install Wrangler CLI**:

   ```bash
   pnpm add -g wrangler
   ```

2. **Login to Cloudflare**:

   ```bash
   wrangler login
   ```

3. **Configure `wrangler.toml`**:

   - Update `name` to your worker name
   - Set environment variables

4. **Deploy**:
   ```bash
   pnpm run deploy
   ```

### Environment-Specific Deployments

Create environment sections in `wrangler.toml`:

```toml
[env.staging]
name = "astro-website-staging"
vars = { STORYBLOK_VERSION = "draft" }
```

Deploy to staging:

```bash
pnpm run deploy:staging
```

## 🔍 Lighthouse CI

Automated performance monitoring runs on every PR:

1. **Automatic deployment**: Creates a preview deployment on Cloudflare
2. **Comprehensive testing**: Fetches all URLs from Storyblok
3. **Baseline comparison**: Compares PR performance against main branch
4. **PR comments**: Posts detailed diff as a sticky comment

**Local Lighthouse testing**:

```bash
pnpm add -D @lhci/cli
pnpm exec lhci collect --config=.lighthouserc.json
```

## 🏗️ Architecture Decisions

### Why Storyblok?

- **Visual editing**: Non-technical team members can edit content
- **Type generation**: Automatic TypeScript types from CMS schema
- **Flexible content**: Block-based architecture
- **Preview mode**: Real-time preview in visual editor

### Why Cloudflare Workers?

- **Global edge network**: Fast response times worldwide
- **Scalability**: Auto-scaling with no cold starts
- **Cost-effective**: Generous free tier
- **Developer experience**: Great local development with Wrangler

### Why storyblok-rich-text-astro-renderer?

- **SSR-friendly**: Server-side rendering in Astro
- **Component integration**: Embed Astro components in rich text
- **Type-safe**: TypeScript support out of the box
- **Customizable**: Full control over node/mark rendering

### Project Structure Philosophy

- **Separation of concerns**: UI components separate from Storyblok components
- **Type safety**: Strict TypeScript for reliability
- **Component composition**: Small, focused components
- **Convention over configuration**: Clear naming and folder structure

## 📚 Additional Resources

### Documentation

- **AI Agent Guidelines**: See `ai-readme/` folder for detailed guidelines on:
  - Project structure rules
  - Storyblok integration patterns
  - Development workflow

### Key Files

- `astro.config.ts` - Main configuration
- `wrangler.toml` - Cloudflare Workers config
- `tailwind.config.js` - Tailwind configuration
- `tsconfig.json` - TypeScript configuration

### Useful Links

- [Astro Documentation](https://docs.astro.build)
- [Storyblok Astro SDK](https://github.com/storyblok/storyblok-astro)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Follow the coding guidelines in `ai-readme/README.workflow.md`
2. Run `pnpm run check` before committing
3. Use meaningful commit messages
4. Create feature branches from `main`
5. Submit PRs for review

## 📝 License

[Your License Here]

## 🆘 Troubleshooting

### Storyblok Types Not Updating

```bash
# Clear cache and regenerate
rm -rf src/types/storyblok*
pnpm run storyblok:sync
```

### Cloudflare Workers Build Errors

```bash
# Check for Node.js compatibility issues
# Ensure nodejs_compat flag is set in wrangler.toml
compatibility_flags = ["nodejs_compat"]
```

### Cache Not Invalidating

1. Check webhook is configured correctly in Storyblok
2. Verify `STORYBLOK_WEBHOOK_SECRET` matches
3. Check Cloudflare API credentials
4. Review logs in Cloudflare Workers dashboard

### Lighthouse CI Failing

1. Ensure all required environment variables are set in GitHub secrets
2. Check that the preview deployment succeeded
3. Verify Storyblok URLs are accessible
4. Review workflow logs in GitHub Actions

---
