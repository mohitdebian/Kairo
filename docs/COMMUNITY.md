# Community Building Strategy

To make Kairo a massive success, writing code is only 50% of the battle. The other 50% is community building.

## GitHub Discussions Setup

We use GitHub Discussions instead of Discord for long-term searchable knowledge. 

### Categories:
- 📢 **Announcements**: Release notes, roadmap updates (Maintainers only).
- 💬 **General**: Anything related to browsers, productivity, or Kairo.
- 💡 **Ideas**: Feature requests that need flesh before becoming GitHub Issues.
- 🛠️ **Help & Q&A**: Users helping users troubleshoot setup or installation.
- 🎨 **Showcase**: Post screenshots of your custom workspaces, themes, or plugin setups!

## GitHub Labels Strategy

To keep issues organized, we use standard labeling with specific colors:

### Triage & Workflow
- `good first issue` (🟩 Green) - Perfect for new contributors! Usually simple CSS fixes or typo corrections.
- `help wanted` (🟦 Blue) - The core team doesn't have time for this, but it's approved for anyone to tackle.
- `needs triage` (🟨 Yellow) - New issue, maintainers need to review.

### Categories
- `bug` (🟥 Red) - Something is broken.
- `enhancement` (🩵 Light Blue) - New feature or improvement.
- `ui / ux` (🪻 Purple) - Design, CSS, layout, or animations.
- `performance` (🟧 Orange) - Memory leaks, CPU spikes.
- `security` (🛑 Dark Red) - Security vulnerabilities.
- `documentation` (📝 White) - README, docs, or code comments.

### Subsystems
- `browser-core` (⚙️ Gray) - Main process, tabs, navigation.
- `ai` (✨ Sparkle) - LLM integrations, smart tab grouping.

## Attracting Contributors (0 to 100 Stars)

1. **The README is your landing page:** It must be stunning. Use GIFs, high-res screenshots, and a clear vision.
2. **Label heavily:** Maintain at least 5-10 `good first issue` tickets at all times so newcomers can easily make their first PR.
3. **Be absurdly welcoming:** Thank every single person who opens a PR, even if the code needs heavy refactoring.
4. **Launch on Hacker News / Product Hunt:** Once Phase 1 is stable and polished, launch publicly. "Show HN: Kairo - A glassmorphic productivity browser built in Electron/React."

## PR Review Guide for Maintainers

1. **Speed is everything:** Try to review PRs within 48 hours. A stale PR kills contributor momentum.
2. **Review the architecture, not just the syntax:** Use linters for syntax. Humans should review logic and memory leaks.
3. **Be kind:** Use "We" instead of "You". (e.g., "Instead of doing X, we should try doing Y because...")
