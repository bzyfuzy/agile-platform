---
id: microservices
title: Microservices design
sidebar_position: 2
---

# Microservices design

Each service is an independent Rust binary — separate compile unit, separate process, separate data ownership.

## Service boundaries

```mermaid
flowchart TD
    subgraph Auth["Auth service — identity"]
        A1["Users & orgs"]
        A2["JWT issuance"]
        A3["OAuth2 / SSO"]
    end
    subgraph Project["Project service — work items"]
        P1["Projects & epics"]
        P2["Stories & tasks"]
        P3["Comments & history"]
    end
    subgraph Sprint["Sprint service — execution"]
        S1["Sprint planning"]
        S2["Kanban board"]
        S3["Retrospectives"]
    end
    subgraph Pipeline["Pipeline service — delivery"]
        C1["Pipeline definitions"]
        C2["Job orchestration"]
        C3["Log streaming"]
    end
    subgraph Analytics["Analytics service — insights"]
        AN1["Burndown & velocity"]
        AN2["Cycle & lead time"]
        AN3["Dashboards"]
    end

    Auth -->|user_created event| Project
    Project -->|story_created event| Sprint
    Sprint -->|sprint_completed event| Analytics
    Pipeline -->|run_completed event| Analytics
```

## Inter-service communication

Services never call each other via HTTP. All cross-service communication is **async via NATS JetStream events**.

| Publisher | Event | Subscribers |
|---|---|---|
| Auth | `user.created` | Project, Analytics |
| Auth | `org.plan_changed` | All services |
| Project | `story.created` | Analytics |
| Project | `story.status_changed` | Sprint, Analytics |
| Sprint | `sprint.completed` | Analytics |
| Pipeline | `run.completed` | Analytics |
| Pipeline | `run.failed` | Auth (for notifications) |
