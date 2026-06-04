# Release Strategy

Kairo uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`). Because Kairo is a browser and security is critical, we employ a phased release cycle.

## Release Channels

### 1. Alpha (`nightly` / `v0.x.x-alpha`)
- **Who it's for:** Core developers and contributors.
- **Cadence:** Auto-built by CI/CD on every push to the `main` branch.
- **Stability:** Highly unstable. Features may break or vanish completely.

### 2. Beta (`beta` / `v1.x.x-beta`)
- **Who it's for:** Early adopters and power users who want the newest features and don't mind occasional crashes.
- **Cadence:** Cut from `main` every 2 weeks.
- **Stability:** Mostly stable, but memory leaks or UI glitches may slip through.

### 3. Stable (`stable` / `v1.x.x`)
- **Who it's for:** The general public.
- **Cadence:** Cut from the `beta` branch once a month, after a 2-week testing period.
- **Stability:** Production-ready.

## Hotfixes
Critical security vulnerabilities or catastrophic crashes (e.g., app fails to launch) bypass the standard cycle. A hotfix branch is cut directly from `stable`, patched, and released immediately as a `PATCH` version bump (e.g., `v1.0.1` -> `v1.0.2`).

## Version Bumping Rules
- **MAJOR**: Massive UI overhauls, underlying engine migrations (e.g., updating Electron by several major versions), breaking extensions API.
- **MINOR**: New features (Spaces, AI Grouping, Split View).
- **PATCH**: Bug fixes, security patches, minor UI tweaks.
