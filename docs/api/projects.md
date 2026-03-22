---
id: projects
title: Projects API
sidebar_position: 3
---

# Projects API

### POST /projects

```json
{ "name": "AgilePlatform", "key": "AP", "description": "The platform itself" }
```

### GET /stories?project_id=...&status=backlog

```json
{
  "data": [{ "id": "...", "title": "...", "status": "backlog", "story_points": 5 }],
  "meta": { "page": 1, "per_page": 25, "total": 48 }
}
```
