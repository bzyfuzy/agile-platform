---
id: pipeline
title: Pipeline service
sidebar_position: 4
---

# Pipeline service

The pipeline service manages CI/CD pipeline definitions, orchestrates job execution across runners, streams live logs, and records deployment history.

**Port:** `8004`  
**Database schema:** `pipeline`  
**Redis:** `:6382` — job queue (List), run status (String), log streams (Stream)

## Pipeline run lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending : trigger received
    Pending --> Running : runner picks up job
    Running --> Success : all jobs pass
    Running --> Failed : any job fails
    Running --> Cancelled : user cancels
    Failed --> Pending : retry triggered
    Success --> [*]
    Failed --> [*]
    Cancelled --> [*]
```

## Trigger → run flow

```mermaid
flowchart TD
    T1["Git push"] & T2["Pull request"] & T3["Schedule\n(cron)"] & T4["Manual\ntrigger"] --> GW["API Gateway"]
    GW --> PS["Pipeline service"]
    PS --> DB[("PostgreSQL\npipeline.runs")]
    PS --> Q[("Redis :6382\nqueue:jobs")]
    Q -->|BRPOP| W1["Runner 1"]
    Q -->|BRPOP| W2["Runner 2"]
    Q -->|BRPOP| W3["Runner 3"]
    W1 & W2 & W3 --> Stages["Execute stages\nin parallel"]
    Stages --> Logs[("Redis Stream\nlogs:run_id")]
    Stages --> Status[("Redis\nrun:id:status")]
    Stages --> DB2[("PostgreSQL\npipeline.jobs")]
```

## Pipeline YAML definition

Pipelines are defined in `.agile-ci.yml` at the repo root:

```yaml
name: Build and deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

stages:
  - build
  - test
  - deploy

jobs:
  compile:
    stage: build
    image: rust:1.78-alpine
    script:
      - cargo build --release
    artifacts:
      paths:
        - target/release/app

  unit-tests:
    stage: test
    image: rust:1.78-alpine
    script:
      - cargo test
    needs: [compile]

  integration-tests:
    stage: test
    image: rust:1.78-alpine
    script:
      - cargo test --test integration
    needs: [compile]

  deploy-staging:
    stage: deploy
    environment: staging
    script:
      - docker build -t $IMAGE .
      - docker push $IMAGE
      - kubectl rollout restart deployment/app-staging
    only:
      - develop
    needs: [unit-tests, integration-tests]

  deploy-production:
    stage: deploy
    environment: production
    when: manual
    script:
      - kubectl rollout restart deployment/app-production
    only:
      - main
    needs: [unit-tests, integration-tests]
```

## Live log streaming

Logs are written to a Redis Stream (`XADD`) and read by the client via WebSocket or SSE. The stream is trimmed to the last 10,000 entries to cap memory usage.

```mermaid
sequenceDiagram
    participant Runner
    participant R as Redis :6382
    participant Client

    Runner->>R: XADD logs:run_id * {line: "Running cargo test..."}
    Runner->>R: XADD logs:run_id * {line: "test result: ok. 42 passed"}

    Client->>R: XREAD COUNT 100 BLOCK 0 STREAMS logs:run_id $
    R-->>Client: stream entries (live tail)

    Note over Runner,R: Job completes
    Runner->>R: SET run:run_id:status "success" EX 3600
    Runner->>R: XADD logs:run_id * {type: "eof"}
    Client->>Client: close stream on eof entry
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/pipelines` | Create pipeline definition |
| `GET` | `/pipelines/:id` | Get pipeline |
| `POST` | `/pipelines/:id/trigger` | Manual trigger |
| `GET` | `/runs` | List runs for a project |
| `GET` | `/runs/:id` | Get run detail |
| `POST` | `/runs/:id/cancel` | Cancel a run |
| `POST` | `/runs/:id/retry` | Retry failed run |
| `GET` | `/runs/:id/logs` | Stream logs (SSE) |
| `WS` | `/ws/runs/:id` | Live run WebSocket |
| `GET` | `/environments` | List environments |
| `POST` | `/secrets` | Create secret |
