---
id: redis
title: Redis cache strategy
sidebar_position: 4
---

# Redis cache strategy

Each service owns a dedicated Redis instance. This means independent memory limits, eviction policies, and zero risk of key collision between services.

## Instance map

```mermaid
flowchart LR
    subgraph Services
        A["Auth service"]
        P["Project service"]
        S["Sprint service"]
        CI["Pipeline service"]
        AN["Analytics service"]
    end

    subgraph Redis["Redis instances"]
        R1["Redis :6379\nmaxmemory 256mb\npolicy: allkeys-lru"]
        R2["Redis :6380\nmaxmemory 512mb\npolicy: allkeys-lru"]
        R3["Redis :6381\nmaxmemory 512mb\npolicy: allkeys-lru\nkeyspace events: Ex"]
        R4["Redis :6382\nmaxmemory 1gb\npolicy: volatile-lru"]
        R5["Redis :6383\nmaxmemory 1gb\npolicy: allkeys-lfu"]
    end

    A --> R1
    P --> R2
    S --> R3
    CI --> R4
    AN --> R5
```

## Eviction policy decisions

| Service | Policy | Reason |
|---|---|---|
| Auth | `allkeys-lru` | All keys are re-creatable; evict oldest |
| Project | `allkeys-lru` | Cache is a read optimisation; safe to evict |
| Sprint | `allkeys-lru` | Board state is rebuilt from PG on miss |
| Pipeline | `volatile-lru` | Job queue entries have **no TTL** — must never be evicted; only cached items (with TTL) are evicted |
| Analytics | `allkeys-lfu` | Keep frequently-accessed dashboards; drop cold ones |

## Cache pattern — read-through with write invalidation

```mermaid
sequenceDiagram
    participant Client
    participant Service
    participant Redis
    participant PostgreSQL

    Client->>Service: GET /projects/abc
    Service->>Redis: GET project:abc
    alt Cache hit
        Redis-->>Service: cached JSON
        Service-->>Client: 200 OK (fast)
    else Cache miss
        Redis-->>Service: nil
        Service->>PostgreSQL: SELECT * FROM project.projects WHERE id = 'abc'
        PostgreSQL-->>Service: row data
        Service->>Redis: SET project:abc {json} EX 600
        Service-->>Client: 200 OK
    end

    Client->>Service: PUT /projects/abc
    Service->>PostgreSQL: UPDATE project.projects ...
    Service->>Redis: DEL project:abc
    Service-->>Client: 200 OK
```

## Key reference

### Auth Redis (:6379)

| Key pattern | Type | TTL | Purpose |
|---|---|---|---|
| `session:{user_id}` | String | 24h | Active session data |
| `refresh:{token}` | String | 7d | Refresh token |
| `blacklist:{jti}` | String | Token exp | Revoked JWTs |
| `ratelimit:{ip}` | String | 1m | Login rate limiting |
| `perms:{user_id}` | String | 5m | Cached permissions |

### Sprint Redis (:6381) — special patterns

The sprint Redis has `notify-keyspace-events Ex` enabled. When a `presence:{board_id}` key expires (TTL 30s), Redis emits a keyspace event. The WebSocket handler subscribes to these events and broadcasts "user left" to all board subscribers — no polling required.

```mermaid
sequenceDiagram
    participant User
    participant WS as WebSocket handler
    participant Redis as Sprint Redis
    participant Board as Board subscribers

    User->>WS: connect to board:abc
    WS->>Redis: SET presence:abc:{user_id} "active" EX 30
    WS->>Board: broadcast "user_joined"

    loop Every 20s (heartbeat)
        User->>WS: ping
        WS->>Redis: SET presence:abc:{user_id} "active" EX 30
    end

    Note over User,WS: User disconnects / tab closes
    Note over Redis: Key expires after 30s
    Redis-->>WS: keyspace event __keyevent@0__:expired
    WS->>Board: broadcast "user_left"
```

### Pipeline Redis (:6382) — job queue

The pipeline service uses Redis Lists as a job queue — items pushed without a TTL so `volatile-lru` never evicts them.

```mermaid
flowchart LR
    Trigger["Pipeline trigger\n(push / schedule)"] -->|LPUSH| Queue["queue:jobs\nRedis List"]
    Queue -->|BRPOP| Worker1["Runner worker 1"]
    Queue -->|BRPOP| Worker2["Runner worker 2"]
    Queue -->|BRPOP| Worker3["Runner worker 3"]
    Worker1 & Worker2 & Worker3 -->|SET run:id:status| Status["run status\nRedis String"]
    Worker1 & Worker2 & Worker3 -->|XADD| Logs["logs:run_id\nRedis Stream"]
```

## Rust connection code

```rust
use deadpool_redis::{Config, Pool, Runtime};

pub fn make_redis_pool(url: &str, max_size: usize) -> Pool {
    Config {
        url: Some(url.to_string()),
        pool: Some(deadpool_redis::PoolConfig {
            max_size,
            ..Default::default()
        }),
        ..Default::default()
    }
    .create_pool(Some(Runtime::Tokio1))
    .expect("failed to create Redis pool")
}

// Usage in a handler
pub async fn get_project(
    State(state): State<ProjectState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Project>, AppError> {
    let cache_key = format!("project:{id}");

    // 1. Try cache
    let mut conn = state.redis.get().await?;
    if let Ok(cached) = conn.get::<_, String>(&cache_key).await {
        return Ok(Json(serde_json::from_str(&cached)?));
    }

    // 2. Hit database
    let project = sqlx::query_as!(Project,
        "SELECT * FROM project.projects WHERE id = $1",
        id
    )
    .fetch_one(&state.db)
    .await?;

    // 3. Populate cache
    let _ = conn.set_ex::<_, _, ()>(
        &cache_key,
        serde_json::to_string(&project)?,
        600,
    ).await;

    Ok(Json(project))
}
```
