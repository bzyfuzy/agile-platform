---
id: contributing
title: Contributing
sidebar_position: 3
---

# Contributing

## Development flow

```mermaid
flowchart LR
    Fork["Fork repo"] --> Branch["Create branch\nfeat/my-feature"]
    Branch --> Code["Write code\n+ tests"]
    Code --> PR["Open PR\nagainst main"]
    PR --> CI["CI checks\n(clippy, tests, fmt)"]
    CI --> Review["Code review"]
    Review --> Merge["Merge to main"]
    Merge --> Release["Auto-release\nvia tags"]
```

## Commit convention

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat(sprint): add WIP limit enforcement
fix(auth): handle expired refresh token gracefully
docs(api): add WebSocket message format
chore(deps): upgrade sqlx to 0.8
```

## PR checklist

- [ ] `cargo test --workspace` passes
- [ ] `cargo clippy --workspace` has no warnings
- [ ] `cargo fmt --all --check` passes
- [ ] New public APIs have doc comments
- [ ] Migration files included if schema changes
- [ ] `CHANGELOG.md` updated
