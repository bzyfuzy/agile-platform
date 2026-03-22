---
id: overview
title: API overview
sidebar_position: 1
---

# API overview

All services expose REST over HTTP/1.1 and HTTP/2. Real-time features use WebSockets.

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require a Bearer token:

```bash
curl https://api.agileplatform.dev/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

## Request flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant JWT as JWT middleware
    participant SVC as Service handler

    C->>GW: GET /projects {Authorization: Bearer}
    GW->>JWT: verify token signature + expiry
    alt Token invalid
        JWT-->>C: 401 Unauthorized
    else Token valid
        JWT->>SVC: forward + inject AuthUser
        SVC-->>C: 200 OK {data}
    end
```

## Response format

```json
{ "data": { ... }, "meta": { "page": 1, "per_page": 25, "total": 142 } }
```

Errors:

```json
{ "error": { "code": "STORY_NOT_FOUND", "message": "...", "status": 404 } }
```
