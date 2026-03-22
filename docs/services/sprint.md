---
id: sprint
title: Sprint service
sidebar_position: 3
---

# Sprint service

The sprint service manages sprints, the kanban board, column configuration, card positions, and real-time collaboration. It is the most latency-sensitive service — board interactions must feel instant.

**Port:** `8003`  
**Database schema:** `sprint`  
**Redis:** `:6381` — board state, card locks, user presence, pub/sub for live updates

## Sprint lifecycle

```mermaid
stateDiagram-v2
    [*] --> Planned : create sprint
    Planned --> Active : start sprint
    Active --> Completed : complete sprint
    Completed --> [*]
    Active --> Active : add / remove stories
    Planned --> Planned : adjust dates & capacity
```

## Kanban board — realtime architecture

The board uses WebSockets for all live interactions. When a card is moved, the service acquires a short Redis lock, writes to PostgreSQL, updates the Redis board cache, then broadcasts the event to all connected clients via Redis pub/sub.

```mermaid
sequenceDiagram
    participant U1 as User 1 (drags card)
    participant WS as WebSocket handler
    participant R as Redis :6381
    participant DB as PostgreSQL sprint.*
    participant U2 as User 2 (watching)

    U1->>WS: ws: move_card {card_id, to_column, position}

    WS->>R: SET lock:card_id "user1" EX 10 NX
    alt Lock acquired
        WS->>DB: UPDATE sprint.card_positions ...
        WS->>R: DEL lock:card_id
        WS->>R: SET board:sprint_id {updated_state} EX 60
        WS->>R: PUBLISH board:sprint_id {event}
        R-->>WS: (pub/sub delivery to all subscribers)
        WS-->>U1: ack: card_moved
        WS-->>U2: broadcast: card_moved {card_id, column, position}
    else Lock held by another user
        WS-->>U1: error: card_locked — retry
    end
```

## User presence

```mermaid
sequenceDiagram
    participant U as User
    participant WS as WebSocket handler
    participant R as Redis :6381
    participant Others as Other board users

    U->>WS: connect to /ws/board/:sprint_id
    WS->>R: SET presence:board_id:user_id "active" EX 30
    WS->>R: PUBLISH board:sprint_id {type: "user_joined", user_id}
    R-->>Others: broadcast "user_joined"

    loop Heartbeat every 20s
        U->>WS: ping
        WS->>R: SET presence:board_id:user_id "active" EX 30
    end

    Note over U,WS: Connection drops
    Note over R: Key expires after 30s (keyspace event)
    R-->>WS: __keyevent__:expired → presence:board_id:user_id
    WS->>R: PUBLISH board:sprint_id {type: "user_left", user_id}
    R-->>Others: broadcast "user_left"
```

## WIP limits

When a card is moved to a column, the sprint service checks WIP limits before writing:

```mermaid
flowchart TD
    Move["Move card request"] --> CheckWIP{"Column has WIP limit?"}
    CheckWIP -->|No| Write["Write to DB + broadcast"]
    CheckWIP -->|Yes| Count["Count cards in column"]
    Count --> Over{"At limit?"}
    Over -->|No| Write
    Over -->|Yes| Block["Return 422\nWIP limit exceeded"]
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/sprints` | Create sprint |
| `GET` | `/sprints/:id` | Get sprint detail |
| `PATCH` | `/sprints/:id/start` | Start sprint |
| `PATCH` | `/sprints/:id/complete` | Complete sprint |
| `GET` | `/sprints/:id/board` | Get full board state |
| `POST` | `/sprints/:id/items` | Add story to sprint |
| `DELETE` | `/sprints/:id/items/:story_id` | Remove story |
| `PATCH` | `/board/cards/:id/move` | Move card (REST fallback) |
| `WS` | `/ws/board/:sprint_id` | Live board WebSocket |
| `POST` | `/sprints/:id/retrospective` | Save retrospective |

## Rust WebSocket handler (outline)

```rust
use axum::extract::ws::{Message, WebSocket};

pub async fn board_ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<SprintState>,
    Path(sprint_id): Path<Uuid>,
    Extension(user): Extension<AuthUser>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_board_socket(socket, state, sprint_id, user))
}

async fn handle_board_socket(
    mut socket: WebSocket,
    state: SprintState,
    sprint_id: Uuid,
    user: AuthUser,
) {
    // Register presence
    let presence_key = format!("presence:{}:{}", sprint_id, user.id);
    state.redis.set_ex(&presence_key, "active", 30).await;

    // Subscribe to board channel
    let channel = format!("board:{sprint_id}");
    let mut pubsub = state.redis.subscribe(&channel).await;

    loop {
        tokio::select! {
            // Incoming from client
            Some(Ok(msg)) = socket.recv() => {
                handle_client_message(&state, sprint_id, &user, msg).await;
            }
            // Broadcast from Redis pub/sub
            Some(event) = pubsub.next() => {
                let _ = socket.send(Message::Text(event)).await;
            }
        }
    }
}
```
