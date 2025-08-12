# System Patterns — Kickoff

## Architecture Style
Monolithic CLI application built with Oclif.

## Main Components
- CLI command parser (Oclif)
- Interactive prompt handler (Inquirer.js with multi-select support)
- Config generator (maps user choices to Docker Compose templates)
- File writer (creates `docker-compose.yml` and supporting files)

## Data Flow
`kickoff init` → CLI prompts for input → config generator selects templates →
file writer outputs files → success message.

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
