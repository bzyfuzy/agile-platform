---
id: sprints
title: Sprints API
sidebar_position: 4
---

# Sprints API

### WS /ws/board/:sprint_id

```json
// Client → Server
{ "type": "move_card", "card_id": "...", "column_id": "...", "position": 2 }

// Server → Client
{ "type": "card_moved", "card_id": "...", "moved_by": "alice" }
{ "type": "user_joined", "user": { "display_name": "Bob" } }
```
