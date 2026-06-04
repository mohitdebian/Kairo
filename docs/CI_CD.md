# Continuous Integration / Continuous Deployment (CI/CD)

Kairo uses GitHub Actions for CI/CD. Our pipelines are designed to ensure code quality and automate binary generation.

## 1. Code Quality (Lint & Test)
Runs on **every Pull Request**.
- **Linting:** Runs `eslint` and `prettier` to enforce code style.
- **Type Checking:** Runs `tsc --noEmit` to ensure TypeScript compliance.
- **Unit Tests:** Runs Vitest on utility functions and Zustand stores.

*If this workflow fails, the PR cannot be merged.*

## 2. Build Validation
Runs on **every Pull Request**.
- Attempts to package the application using `electron-builder` for Linux (`AppImage`) to ensure no build errors (e.g., missing assets, broken imports).
- We do not build all OS targets on PRs to save GitHub Action minutes.

## 3. Nightly Releases
Runs on **push to `main`**.
- Builds binaries for macOS (`.dmg`), Windows (`.exe`), and Linux (`.AppImage`, `.deb`).
- Uploads the artifacts to the GitHub Actions tab for developers to download.

## 4. Production Releases
Triggered manually by Maintainers by pushing a Git tag (e.g., `v1.0.0`).
- Runs full build matrices.
- Creates a GitHub Release.
- Uploads all binaries to the GitHub Release page.
- *(Future)* Pushes updates to the Kairo auto-updater server so existing users receive an OTA update.
