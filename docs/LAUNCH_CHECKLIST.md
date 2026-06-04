# Kairo Open Source Launch Checklist

Before flipping the repository from "Private" to "Public", ensure all the following items are complete.

## 1. Codebase & Licensing
- [ ] Ensure `LICENSE` (MIT) is present in the root.
- [ ] Audit the codebase for any hardcoded API keys, personal emails, or internal paths.
- [ ] Ensure `node_modules`, `dist`, and `out` are properly `.gitignore`d.

## 2. Documentation
- [ ] `README.md` is polished, has a great header image, and links work.
- [ ] `CONTRIBUTING.md` has accurate local setup commands.
- [ ] `ROADMAP.md` reflects current realities.
- [ ] `docs/` folder contains Architecture and Governance files.

## 3. Community Tools
- [ ] Issue Templates are set up in `.github/ISSUE_TEMPLATE/`.
- [ ] Pull Request Template is set up.
- [ ] GitHub Discussions is enabled in the repository settings.
- [ ] Labels are created and color-coded.
- [ ] Create at least 3-5 issues labeled `good first issue` so people have something to work on day 1.

## 4. Security
- [ ] `SECURITY.md` is present.
- [ ] Security email is configured to forward to Maintainers.

## 5. Marketing & Launch
- [ ] Record a 60-second loom/demo video showing the UI, Tabs, and Spaces.
- [ ] Write a launch post for Hacker News, Reddit (`r/reactjs`, `r/opensource`), and Twitter.
- [ ] Ensure the Kairo logo/icon is visible in the repo.

## 6. Flipping the Switch
- [ ] Change repo visibility to Public.
- [ ] Post on social media.
- [ ] Monitor issues and PRs closely for the first 48 hours!
