---
id: auth
title: Auth API
sidebar_position: 2
---

# Auth API

### POST /auth/register

```json
{ "org_name": "Acme", "email": "admin@acme.com", "password": "...", "display_name": "Alice" }
```

### POST /auth/login

```json
// Response
{ "data": { "access_token": "eyJ...", "refresh_token": "rt_..." } }
```

### POST /auth/refresh

```json
{ "refresh_token": "rt_..." }
```
