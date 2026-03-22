---
id: auth
title: Auth service
sidebar_position: 1
---

# Auth service

The auth service handles all identity concerns: registration, login, JWT issuance, OAuth2 (GitHub / Google / GitLab), API keys, and organisation management.

**Port:** `8001`  
**Database schema:** `auth`  
**Redis:** `:6379` — sessions, JWT blacklist, rate limits, permissions cache

## Authentication flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant GW as API Gateway
    participant A as Auth service
    participant R as Redis :6379
    participant DB as PostgreSQL auth.*

    C->>GW: POST /auth/login {email, password}
    GW->>A: forward request
    A->>DB: SELECT users WHERE email = ?
    DB-->>A: user row
    A->>A: argon2::verify(password, hash)
    alt Invalid credentials
        A-->>GW: 401 Unauthorized
        GW-->>C: 401
    else Valid
        A->>A: generate JWT (15m) + refresh token (7d)
        A->>R: SET session:{user_id} {data} EX 86400
        A->>R: SET refresh:{token} {user_id} EX 604800
        A-->>GW: 200 {access_token, refresh_token}
        GW-->>C: 200 OK
    end
```

## Token refresh flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant A as Auth service
    participant R as Redis :6379

    C->>GW: POST /auth/refresh {refresh_token}
    GW->>A: forward
    A->>R: GET refresh:{token}
    alt Token not found or expired
        R-->>A: nil
        A-->>C: 401 — re-login required
    else Valid
        R-->>A: user_id
        A->>A: generate new JWT (15m)
        A->>R: SET session:{user_id} {data} EX 86400
        A-->>C: 200 {access_token}
    end
```

## OAuth2 flow (GitHub example)

```mermaid
sequenceDiagram
    participant C as Browser
    participant A as Auth service
    participant GH as GitHub OAuth

    C->>A: GET /auth/oauth/github
    A-->>C: redirect to github.com/login/oauth/authorize
    C->>GH: user authorises app
    GH-->>C: redirect to /auth/oauth/github/callback?code=xxx
    C->>A: GET /auth/oauth/github/callback?code=xxx
    A->>GH: POST /login/oauth/access_token
    GH-->>A: access_token
    A->>GH: GET /user (fetch profile)
    GH-->>A: {id, email, name, avatar}
    A->>A: upsert auth.users + auth.oauth_tokens
    A-->>C: set-cookie: session + redirect to app
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user + org |
| `POST` | `/auth/login` | Email/password login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Revoke session |
| `GET` | `/auth/me` | Current user profile |
| `GET` | `/auth/oauth/:provider` | Start OAuth2 flow |
| `GET` | `/auth/oauth/:provider/callback` | OAuth2 callback |
| `POST` | `/auth/api-keys` | Create API key |
| `DELETE` | `/auth/api-keys/:id` | Revoke API key |

## Rate limiting

Login attempts are rate-limited per IP using Redis:

```rust
// Max 10 attempts per minute per IP
pub async fn check_rate_limit(redis: &RedisPool, ip: &str) -> Result<(), AppError> {
    let key = format!("ratelimit:{ip}");
    let mut conn = redis.get().await?;

    let count: i64 = conn.incr(&key, 1).await?;
    if count == 1 {
        conn.expire::<_, ()>(&key, 60).await?;
    }
    if count > 10 {
        return Err(AppError::RateLimited);
    }
    Ok(())
}
```

## JWT structure

```json
{
  "sub": "018e4b2a-uuid-user-id",
  "org": "018e4b2a-uuid-org-id",
  "role": "admin",
  "jti": "018e4b2a-uuid-token-id",
  "iat": 1712000000,
  "exp": 1712000900
}
```

:::tip Short-lived access tokens
Access tokens expire in **15 minutes**. This limits the blast radius of a leaked token. The refresh token (7 days) is stored `httpOnly` and is never accessible from JavaScript.
:::
