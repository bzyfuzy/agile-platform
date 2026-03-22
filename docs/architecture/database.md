---
id: database
title: Database design
sidebar_position: 3
---

# Database design

AgilePlatform uses a single PostgreSQL 16 cluster with **five isolated schemas** — one per service. This pattern gives you the operational simplicity of a monolithic database with the access isolation of separate databases.

## Schema layout

```mermaid
flowchart LR
    subgraph PG["PostgreSQL — agile_platform"]
        direction TB
        AUTH_S["auth schema\nauth_svc user"]
        PROJ_S["project schema\nproject_svc user"]
        SPR_S["sprint schema\nsprint_svc user"]
        PIPE_S["pipeline schema\npipeline_svc user"]
        ANA_S["analytics schema\nanalytics_svc user (read-all)"]
    end

    AuthSvc["Auth service"] --> AUTH_S
    ProjSvc["Project service"] --> PROJ_S
    SprintSvc["Sprint service"] --> SPR_S
    PipeSvc["Pipeline service"] --> PIPE_S
    AnaSvc["Analytics service"] --> ANA_S
    ANA_S -. "SELECT only" .-> PROJ_S & SPR_S & PIPE_S
```

:::info Analytics cross-schema reads
The `analytics_svc` user is granted `SELECT` on `project`, `sprint`, and `pipeline` schemas so it can compute cross-service metrics like cycle time and throughput. It has no write access to those schemas.
:::

## Auth schema

```mermaid
erDiagram
    organisations ||--o{ users : "has"
    users ||--o{ oauth_tokens : "links"
    users ||--o{ api_keys : "owns"
    users ||--o{ audit_log : "generates"

    organisations {
        uuid id PK
        string name
        string slug
        string plan
        timestamp created_at
    }
    users {
        uuid id PK
        uuid org_id FK
        string email
        string display_name
        string role
        boolean is_active
        timestamp last_login_at
    }
    api_keys {
        uuid id PK
        uuid user_id FK
        string name
        string key_hash
        timestamp expires_at
    }
```

## Project schema

```mermaid
erDiagram
    projects ||--o{ epics : "contains"
    projects ||--o{ stories : "contains"
    epics ||--o{ stories : "groups"
    stories ||--o{ comments : "has"
    stories ||--o{ history : "tracks"

    projects {
        uuid id PK
        uuid org_id
        string name
        string key
        string status
        uuid owner_id
    }
    epics {
        uuid id PK
        uuid project_id FK
        string title
        string status
        int priority
        date due_date
    }
    stories {
        uuid id PK
        uuid project_id FK
        uuid epic_id FK
        string title
        string type
        string status
        int story_points
        uuid assignee_id
    }
```

## Sprint schema

```mermaid
erDiagram
    sprints ||--o{ sprint_items : "contains"
    sprints ||--|{ boards : "has"
    boards ||--o{ columns : "has"
    columns ||--o{ card_positions : "holds"
    sprints ||--o| retrospectives : "produces"

    sprints {
        uuid id PK
        uuid project_id
        string name
        string status
        date start_date
        date end_date
        int capacity_pts
    }
    boards {
        uuid id PK
        uuid sprint_id FK
        string name
    }
    columns {
        uuid id PK
        uuid board_id FK
        string name
        int position
        int wip_limit
        string maps_to
    }
    card_positions {
        uuid story_id PK
        uuid board_id PK
        uuid column_id FK
        int position
    }
```

## Pipeline schema

```mermaid
erDiagram
    pipelines ||--o{ runs : "triggers"
    runs ||--o{ jobs : "contains"
    pipelines }o--|| environments : "deploys to"
    environments ||--o{ secrets : "stores"

    pipelines {
        uuid id PK
        uuid project_id
        string name
        json definition
        json triggers
        boolean is_active
    }
    runs {
        uuid id PK
        uuid pipeline_id FK
        string status
        string trigger
        string commit_sha
        string branch
        timestamp started_at
        int duration_ms
    }
    jobs {
        uuid id PK
        uuid run_id FK
        string name
        string stage
        string status
        int exit_code
    }
```

## Migration strategy

Migrations are managed per-service using [Refinery](https://github.com/rust-db/refinery). Each service has its own `migrations/` directory.

```bash
# Run migrations for the auth service
cargo run -p auth -- migrate

# Check migration status
cargo run -p auth -- migrate status
```

Migration files follow the naming convention `V{version}__{description}.sql`:

```
services/auth/migrations/
  V1__create_organisations.sql
  V2__create_users.sql
  V3__create_oauth_tokens.sql
  V4__create_api_keys.sql
  V5__create_audit_log.sql
```
