# Active Context — Kickoff

## Current Focus
- Enhance `kickoff init` command with additional configuration prompts
- Implement database configuration workflow

## Recent Changes
- Added project name prompt as first question
- Added database requirement prompt
- Added database engine selection (MySQL, MariaDB, PostgreSQL, Other)
- Added custom Docker image input for "Other" option
- Added database version selection with latest 3 versions for each engine
- Added web server selection prompt with conditional options based on project type
- Added PHP/Node.js version selection prompt based on project type
- Added additional services multi-select prompt with conditional sub-prompts for search engine, caching services, and MailHog

## Next Steps
1. Map database choices to Docker Compose templates
2. Write generated files to disk
3. Add additional service prompts (Mailhog, Redis, search server, etc.)
4. Add web server selection to Docker Compose template generation

## Active Decisions
- Use Oclif for CLI
- Keep architecture monolithic
- Provide "Other" option for custom Docker images
- Show only latest 3 versions for each database engine

## Constraints
- Must run on macOS/Linux with Docker & Docker Compose installed

## Risks
- Docker version differences may cause incompatibility
