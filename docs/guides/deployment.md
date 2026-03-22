---
id: deployment
title: Deployment
sidebar_position: 2
---

# Deployment

## Kubernetes deployment

```mermaid
flowchart TD
    GH["GitHub Actions"] -->|docker push| GHCR["ghcr.io registry"]
    GHCR -->|kubectl apply| K8S

    subgraph K8S["Kubernetes cluster"]
        subgraph NS_STAGE["staging namespace"]
            AUTH_S["auth deployment\n2 replicas"]
            PROJ_S["project deployment\n2 replicas"]
        end
        subgraph NS_PROD["production namespace"]
            AUTH_P["auth deployment\n3 replicas"]
            PROJ_P["project deployment\n3 replicas"]
        end
        subgraph SHARED["shared namespace"]
            PG["PostgreSQL\nStatefulSet"]
            REDIS["Redis ×5\nStatefulSets"]
            NATS["NATS\nStatefulSet"]
        end
    end
```

## Helm chart

```bash
# Add the AgilePlatform chart repo
helm repo add agileplatform https://charts.agileplatform.dev
helm repo update

# Install to your cluster
helm install agileplatform agileplatform/agileplatform \
  --namespace agileplatform \
  --create-namespace \
  --set global.domain=agile.yourcompany.com \
  --set postgres.password=your_secure_password \
  --set jwt.secret=your_64_char_secret
```

## Environment variables (production)

```bash
DATABASE_URL=postgres://agile:${PG_PASSWORD}@postgres:5432/agile_platform
REDIS_AUTH_URL=redis://redis-auth:6379
JWT_SECRET=${JWT_SECRET}          # min 64 chars
RUST_LOG=info                     # warn in production
OTLP_ENDPOINT=http://otel:4317   # OpenTelemetry collector
```
