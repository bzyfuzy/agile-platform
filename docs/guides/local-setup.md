---
id: local-setup
title: Local setup
sidebar_position: 1
---

# Local setup

This guide walks you through running AgilePlatform locally for development.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Rust | ≥ 1.78 | [rustup.rs](https://rustup.rs) |
| Docker | ≥ 24 | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | ≥ 2.20 | Bundled with Docker Desktop |
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) (for frontend only) |

## Step 1 — Clone and configure

```bash
git clone https://github.com/your-org/agile-platform
cd agile-platform
cp .env.example .env
```

Edit `.env` with your local settings:

```bash
# PostgreSQL
DATABASE_URL=postgres://agile:secret@localhost:5432/agile_platform

# Redis (one per service)
REDIS_AUTH_URL=redis://localhost:6379
REDIS_PROJECT_URL=redis://localhost:6380
REDIS_SPRINT_URL=redis://localhost:6381
REDIS_PIPELINE_URL=redis://localhost:6382
REDIS_ANALYTICS_URL=redis://localhost:6383

# NATS
NATS_URL=nats://localhost:4222

# JWT
JWT_SECRET=change-me-in-production-use-at-least-64-chars

# OAuth2 (optional for local dev)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## Step 2 — Start infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis ×5 on ports `6379–6383`
- NATS on port `4222`

Check everything is healthy:

```bash
docker compose ps
```

## Step 3 — Run migrations

```bash
# Run all service migrations
cargo run -p migrations
```

Or per-service:

```bash
cargo run -p auth     -- migrate
cargo run -p project  -- migrate
cargo run -p sprint   -- migrate
cargo run -p pipeline -- migrate
cargo run -p analytics -- migrate
```

## Step 4 — Start the services

Open five terminal tabs (or use a process manager like `overmind`):

```bash
# Tab 1
cargo run -p auth

# Tab 2
cargo run -p project

# Tab 3
cargo run -p sprint

# Tab 4
cargo run -p pipeline

# Tab 5
cargo run -p analytics
```

Or use `overmind` with the provided `Procfile`:

```bash
# Install overmind
brew install overmind   # macOS
# or
cargo install overmind  # via cargo

# Start everything
overmind start
```

## Step 5 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Development workflow

```mermaid
flowchart LR
    Edit["Edit Rust code"] --> Check["cargo check\n(fast type check)"]
    Check --> Test["cargo test"]
    Test --> Run["cargo run -p SERVICE"]
    Run --> Try["Test in browser / curl"]
    Try --> Edit
```

## Useful commands

```bash
# Check all services compile
cargo check --workspace

# Run all tests
cargo test --workspace

# Run a specific service's tests
cargo test -p auth

# Format code
cargo fmt --all

# Lint
cargo clippy --workspace

# Check for outdated dependencies
cargo outdated
```

## Troubleshooting

**PostgreSQL connection refused**
```bash
# Check if container is running
docker compose ps postgres
# Check logs
docker compose logs postgres
```

**Redis connection refused**
```bash
# Test a specific Redis instance
redis-cli -p 6381 ping
# Should return PONG
```

**Migration failed**
```bash
# Check migration status
cargo run -p auth -- migrate status
# Reset and re-run (⚠️ destroys data)
cargo run -p auth -- migrate reset
```
