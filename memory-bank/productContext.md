# Product Context — Kickoff

## Why This Project Exists
Kickoff exists to save developers time when setting up local development
environments for Drupal, Symfony, and Next.js projects. It removes repetitive
manual configuration steps while keeping the setup transparent and extensible.

## Main User Journey
1. User installs the CLI tool.
2. Runs `kickoff init` with optional command-line arguments for scriptable usage, or without arguments for interactive prompts.
3. CLI processes arguments or prompts for:
   - Project name (directory name)
   - Framework (Drupal, Symfony, Next.js)
   - PHP/Node.js version
   - Web server (nginx, apache, nginx unit, none)
   - Additional services (database, Mailhog, Redis, search server, other)
   - Multi-select prompt for additional services (search engine, MailHog, caching services)
   - Conditional prompts for selected services (search engine choice, caching service selection)
4. A loading spinner is displayed while files are generated.
5. Docker Compose file and any additional files are created.

## UX Principles
- Simple CLI prompts
- Clear output
- Minimal required input

## Accessibility/Localization
None.

## Competitive Edge
- Simple and transparent
- Does not hide that it’s Docker Compose under the hood
- Easily extendable

## Edge Cases
None identified for v1.
