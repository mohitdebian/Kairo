# Open Source Governance

Kairo is an open-source project driven by community contribution. To prevent chaos and ensure the project remains sustainable, we use a structured governance model.

## Roles and Responsibilities

### 1. Maintainers (The Core Team)

Maintainers have write access to the repository, triage issues, and have final say on architectural decisions.

- **Responsibilities:**
  - Review and merge Pull Requests.
  - Dictate the Roadmap and vision.
  - Enforce the Code of Conduct.
  - Manage release cycles.
- **How to become one:** Demonstrating long-term commitment, exceptional technical judgment, and strong community leadership as a Core Contributor.

### 2. Core Contributors

Core Contributors do not have push access to `main`, but they are recognized leaders in the community.

- **Responsibilities:**
  - Lead major feature development (e.g., building out AI features).
  - Triage issues (adding labels, closing duplicates).
  - Perform first-pass code reviews for new contributors.
- **How to become one:** Submit high-quality PRs consistently over several months and demonstrate a deep understanding of the architecture.

### 3. Contributors

Anyone who submits a PR or reports a bug!

- **Responsibilities:**
  - Follow the `CONTRIBUTING.md` guidelines.
  - Write clean, documented code.
  - Engage respectfully in Discussions.

## Decision Making Process

Kairo operates under a **"Benevolent Dictator for Life" (BDFL) / Core Team Consensus** model.

1. **RFCs (Request for Comments):** For massive architectural changes (e.g., migrating from Electron to Tauri), an RFC must be opened in GitHub Discussions.
2. **Community Feedback:** Contributors debate the merits of the RFC.
3. **Final Call:** The Maintainers evaluate the feedback and make a final technical decision.

## Conflict Resolution

If a technical disagreement stalls a PR, Maintainers will step in to act as tie-breakers. All discussions must adhere strictly to the [Code of Conduct](../CODE_OF_CONDUCT.md).
