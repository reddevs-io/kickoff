# System Patterns — Kickoff

## Architecture Style
Monolithic CLI application built with Oclif.

## Main Components
- CLI command parser (Oclif)
- Interactive prompt handler (Inquirer.js with multi-select support)
- Docker Compose generator service (programmatic YAML generation using js-yaml)
- File writer (creates `docker-compose.yml` and supporting files)

## Data Flow
`kickoff init` → CLI arguments or prompts for input → DockerComposeGenerator service creates configuration objects →
js-yaml serializes to YAML → file writer outputs files → success message.

## API Style
None — all local file generation.

## Persistence
No persistent storage; configs generated per run.

## Security
No authentication; relies on local environment security.

## Observability
Basic console logging and error messages; no external tracking.

## Performance Targets
- Generate setup in < 30 seconds

## Disaster Recovery
If generation fails, partial files are removed and an error is displayed.
