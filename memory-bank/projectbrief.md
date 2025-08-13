# Project Brief — Kickoff

## Overview
Kickoff is a CLI tool that speeds up bootstrapping a Docker Compose setup for
Drupal, Symfony, or Next.js development projects, with optional additional
services based on user input.

## Core Problem
Developers often spend time manually configuring Docker Compose setups for
common frameworks. Kickoff automates this process, reducing setup time and
ensuring consistency.

## Goals
1. Ease of use
2. Clarity
3. Extensibility

## Non-Goals
1. Not intended for production deployments
2. Not intended to abstract Docker Compose
3. Not install services that you don't need

## Scope
**In Scope (v1):**
- Bootstrap Docker Compose setups for Drupal, Symfony, and Next.js
- Allow selection of optional services (database, Mailhog, Redis, search server, other)

**Out of Scope (v1):**
- Automatic updates

## Success Metrics
- Generate a working Docker Compose setup in under 30 seconds
- Zero manual edits needed after generation

## Target Users
Backend developers on macOS/Linux using the terminal.

## Compliance/Privacy
None.

## Risks
- Docker version differences may cause incompatibility

## Assumptions
- Users already have Docker and Docker Compose installed
