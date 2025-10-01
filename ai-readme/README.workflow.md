# Project workflow guidelines

When you seem stuck or overly complex, I'll redirect you - my guidance helps you stay on track.

## 🚨 AUTOMATED CHECKS ARE MANDATORY

**ALL checks must be ✅ GREEN - BLOCKING everything!**  
No errors. No formatting issues. No linting problems. Zero tolerance.  
These are not suggestions. Fix ALL issues before continuing.

**Run this command to check everything:**

```bash
pnpm run check
```

This runs:

- `astro check` - TypeScript and Astro validation
- `eslint .` - Code quality checks
- `prettier --check .` - Code formatting

**Auto-fix command:**

```bash
pnpm run fix
```

## CRITICAL WORKFLOW - ALWAYS FOLLOW THIS!

### Research → Plan → Implement

**NEVER JUMP STRAIGHT TO CODING!** Always follow this sequence:

1. **Research**: Explore the codebase, understand existing patterns
2. **Plan**: Create a detailed implementation plan and verify it with me
3. **Implement**: Execute the plan with validation checkpoints

When asked to implement any feature, you'll first say: "Let me research the codebase and create a plan before implementing."

### Reality Checkpoints

**Stop and validate** at these moments:

- After implementing a complete feature
- Before starting a new major component
- When something feels wrong
- Before declaring "done"
- **WHEN CHECKS FAIL WITH ERRORS** ❌

Run: `pnpm run check && pnpm run build`

> Why: You can lose track of what's actually working. These checkpoints prevent cascading failures.

### 🚨 CRITICAL: Check Failures Are BLOCKING

**When `pnpm run check` reports ANY issues, you MUST:**

1. **STOP IMMEDIATELY** - Do not continue with other tasks
2. **FIX ALL ISSUES** - Address every ❌ issue until everything is ✅ GREEN
3. **VERIFY THE FIX** - Re-run the failed command to confirm it's fixed
4. **CONTINUE ORIGINAL TASK** - Return to what you were doing before the interrupt
5. **NEVER IGNORE** - There are NO warnings, only requirements

This includes:

- TypeScript errors (astro check)
- ESLint violations
- Prettier formatting issues
- Astro component errors

Your code must be 100% clean. No exceptions.

## Working Memory Management

### When context gets long:

- Re-read all of the `**/README.*.md` files
- Summarize progress in existing documentation
- Document current state before major changes

### Maintain TODO.md:

```
## Current Task
- [ ] What we're doing RIGHT NOW

## Completed
- [x] What's actually done and tested

## Next Steps
- [ ] What comes next
```

## Astro + Storyblok Specific Rules

### FORBIDDEN - NEVER DO THESE:

- **NO** `any` types - use proper TypeScript types!
- **NO** `unknown` types - use proper TypeScript types!
- **NO** inline styles - use Tailwind CSS classes
- **NO** keeping old and new components together
- **NO** migration functions or compatibility layers
- **NO** versioned component names (HeaderV2, HeroNew)
- **NO** TODOs in final code
- **NO** hardcoded content - use Storyblok for content management

### Required Standards:

- **Delete** old components when replacing them
- **Meaningful names**: `productCard` not `card`
- **Component composition** over large monolithic components
- **Props interfaces** for all component props
- **Storyblok schema alignment**: Components must match Storyblok schema
- **Responsive design**: Mobile-first approach with Tailwind
- **Performance**: Use Astro's built-in optimizations
- **SEO**: Proper meta tags and semantic HTML

### Code Comments Policy:

**Comments are generally an anti-pattern** - prefer self-documenting code through:

- Clear variable and function names
- Well-structured component composition
- Proper TypeScript types

**Use comments ONLY in these specific cases:**

- Complex regular expressions that aren't immediately obvious
- Non-obvious business logic or algorithms
- Workarounds for browser bugs or third-party library issues
- Complex mathematical calculations

**NEVER comment:**

- What the code does (code should be self-explanatory)
- Obvious operations
- Component props or return types (use TypeScript)
- Temporary debugging information

## Implementation Standards

### Our code is complete when:

- ✅ All checks pass (`pnpm run check`)
- ✅ Build succeeds (`pnpm run build`)
- ✅ Feature works end-to-end
- ✅ Responsive on all devices
- ✅ Storyblok integration works in visual editor
- ✅ Old code is deleted
- ✅ TypeScript types are properly defined

### Testing Strategy

- Visual testing in Storyblok's visual editor
- Manual testing across devices
- Build verification for production readiness
- Performance validation (Lighthouse)

## Problem-Solving Together

When you're stuck or confused:

1. **Stop** - Don't spiral into complex solutions
2. **Delegate** - Consider spawning agents for parallel investigation
3. **Ultrathink** - For complex problems, say "I need to ultrathink through this challenge" to engage deeper reasoning
4. **Step back** - Re-read the requirements
5. **Simplify** - The simple solution is usually correct
6. **Ask** - "I see two approaches: [A] vs [B]. Which do you prefer?"

My insights on better approaches are valued - please ask for them!

## Performance & SEO

### **Measure First**:

- Use Astro's built-in optimizations
- Lighthouse audits for performance validation
- Image optimization with Astro's `<Image>` component
- Use ViewTransitions API for SPA-like navigation

### **SEO Always**:

- Semantic HTML structure
- HTML semantically correct
- Proper heading hierarchy (h1 → h6)
- Meta descriptions and titles
- Structured data where appropriate
- Accessible components (ARIA labels, contrast)

## Communication Protocol

### Progress Updates:

```
✅ Implemented hero section (all checks passing)
✅ Added testimonials carousel
❌ Found TypeScript issue in navigation - investigating
```

### Suggesting Improvements:

"The current approach works, but I notice [observation].
Would you like me to [specific improvement]?"

## Development Commands

### Core Development:

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
```

### Quality Assurance:

```bash
pnpm run check        # Run all checks (MANDATORY)
pnpm run fix          # Auto-fix linting and formatting
```

### Storyblok Integration:

```bash
pnpm run storyblok:sync      # Sync component types
pnpm run storyblok:fetch     # Fetch latest schema
pnpm run storyblok:generate  # Generate TypeScript types
```

### Deployment:

```bash
pnpm run deploy              # Deploy to Cloudflare
pnpm run preview:cloudflare  # Preview on Cloudflare locally
```

## Working Together

- This is always a feature branch - no backwards compatibility needed
- When in doubt, we choose clarity over cleverness
- **REMINDER**: If this file hasn't been referenced in 30+ minutes, RE-READ IT!
- Storyblok visual editor experience is paramount
- Mobile-first, responsive design is non-negotiable
- Follow the Code Comments Policy above - comments are generally anti-patterns

Avoid complex abstractions or "clever" code. The simple, obvious solution is probably better, and my guidance helps you stay focused on what matters.
