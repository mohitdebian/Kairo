# Security Policy

The Kairo team and community take the security of our browser and user data extremely seriously. 

## Supported Versions

We currently support the latest major version of Kairo. Security updates are prioritized for the `main` branch and the most recent stable release tag.

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT create a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, please report it immediately by sending an email to:
**security@example.com** *(Replace with actual email before launch)*

Please include the following information in your report:
1. **Description:** A clear description of the vulnerability.
2. **Steps to Reproduce:** Exact steps to reproduce the issue (including OS, Kairo version, and payload if applicable).
3. **Impact:** The potential impact of the vulnerability.
4. **Proposed Fix:** (Optional) If you have a fix, please include it.

### Severity Levels

We classify vulnerabilities using the CVSS (Common Vulnerability Scoring System) framework:
- **Critical**: Remote Code Execution (RCE) in the main process, sandbox escapes, or unrestricted local file access.
- **High**: Cross-Site Scripting (XSS) in privileged UI contexts (Sidebar, Settings), bypassing security policies.
- **Medium**: Denial of Service (DoS), UI redressing/spoofing.
- **Low**: Minor information leaks, non-exploitable crashes.

### Our Response Process

1. We will acknowledge receipt of your report within 48 hours.
2. We will investigate the issue and determine its severity.
3. We will work to patch the vulnerability and push a hotfix release.
4. We will publicly acknowledge your contribution (if desired) once the patch is released and users have had time to update.

## Responsible Disclosure

We ask that you practice responsible disclosure:
- Do not publicly disclose the vulnerability until we have had a reasonable amount of time to patch it (usually 30-90 days, depending on severity).
- Do not exploit the vulnerability for any reason other than demonstrating it to the Kairo team.

Thank you for helping us keep Kairo safe!
