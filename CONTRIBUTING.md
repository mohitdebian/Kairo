# Contributing to Kairo

First off, thank you for considering contributing to Kairo! It's people like you that make open source such a fantastic community to learn, inspire, and create.

We want to make contributing to Kairo as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Local Setup

Kairo is built with Electron, React, Vite, and TailwindCSS.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or yarn
- Git

### Installation

1. Fork the repo on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Kairo.git
   cd Kairo
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🌳 Branching Strategy

We use a simple branching strategy:

- `main` is our active development branch. It should always be deployable.
- Feature branches should be branched off `main` and named descriptively:
  - `feat/add-ai-tab-groups`
  - `fix/sidebar-crash`
  - `docs/update-readme`
  - `refactor/tab-drag-drop`

## 📝 Commit Standards

We strictly follow [Conventional Commits](https://www.conventionalcommits.org/). This allows us to auto-generate changelogs and version bumps.

Format: `<type>(<scope>): <subject>`

Examples:

- `feat(sidebar): add support for nested folders`
- `fix(tabs): resolve memory leak when closing tabs`
- `docs(readme): update installation instructions`
- `chore(deps): bump electron to v28`

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## 🔄 Pull Request Process

1. **Keep it focused:** Ensure your PR does one thing and does it well. If you have multiple unrelated changes, submit multiple PRs.
2. **Sync with main:** Make sure your branch is up to date with `main` before submitting.
3. **Fill out the template:** When you open a PR, a template will automatically populate. Fill it out completely. Include screenshots or videos for UI changes!
4. **Pass CI:** Ensure all GitHub Actions (linting, tests, build) pass.
5. **Code Review:** A maintainer will review your code. We aim to review PRs within 48 hours. We might request changes—don't take it personally, we just want to ensure high quality!

## 🧪 Best Practices & Code Style

- **TypeScript:** We strictly use TypeScript. Avoid `any` whenever possible. Use robust interfaces.
- **Styling:** We use TailwindCSS. Do not use raw CSS files unless absolutely necessary (like for Electron-specific drag regions).
- **State Management:** We use Zustand. Keep global state minimal.
- **IPC Communication:** When sending messages between the Main process and the Renderer, always strongly type your channels in `preload/index.ts`.

## 🆘 Where to get help

If you're stuck, don't hesitate to ask for help!

- Comment on the Issue you're working on.
- Start a [GitHub Discussion](https://github.com/mohitdebian/Kairo/discussions).

Thank you for helping us build Kairo! 🚀
