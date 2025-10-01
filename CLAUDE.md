# CLAUDE.md

**IMPORTANT!**

At the start of each session read:

1. `ai-readme/README.project-structure.md`
2. `ai-readme/README.storyblok-integration.md`
3. `ai-readme/README.workflow.md`

Follow guidelines and instructions included in those README files.

## ADDITIONAL NOTES

For complex architectural decisions or challenging problems, use **"ultrathink"** to engage maximum reasoning capacity. Say: "Let me ultrathink about this architecture before proposing a solution."

### USE MULTIPLE AGENTS!

_Leverage subagents aggressively_ for better results:

- Spawn agents to explore different parts of the codebase in parallel
- Use one agent to write tests while another implements features
- Delegate research tasks: "I'll have an agent investigate the Storyblok schema while I analyze the component structure"
- For complex refactors: One agent identifies changes, another implements them

Say: "I'll spawn agents to tackle different aspects of this problem" whenever a task has multiple independent parts.
