---
id: pipelines
title: Pipelines API
sidebar_position: 5
---

# Pipelines API

### GET /runs/:id/logs (SSE)

```bash
curl -N https://api.agileplatform.dev/runs/.../logs \
  -H "Authorization: Bearer eyJ..."
# Streams log lines as SSE events
```
