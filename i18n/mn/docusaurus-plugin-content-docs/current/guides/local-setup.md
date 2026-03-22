---
id: local-setup
title: Локал тохиргоо
sidebar_position: 1
---

# Локал тохиргоо

Энэ гарын авлага AgilePlatform-ийг хөгжүүлэлтийн зориулалтаар локал орчинд ажиллуулах алхмуудыг тайлбарлана.

## Шаардлагатай хэрэгслүүд

| Хэрэгсэл | Хувилбар | Суулгах |
|---|---|---|
| Rust | ≥ 1.78 | [rustup.rs](https://rustup.rs) |
| Docker | ≥ 24 | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | ≥ 2.20 | Docker Desktop-тэй хамт |
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) (зөвхөн frontend) |

## 1-р алхам — Клон хийж тохируулах

```bash
git clone https://github.com/your-org/agile-platform
cd agile-platform
cp .env.example .env
```

`.env` файлыг локал тохиргоогоор засна:

```bash
# PostgreSQL
DATABASE_URL=postgres://agile:secret@localhost:5432/agile_platform

# Redis (үйлчилгээ бүрт нэг)
REDIS_AUTH_URL=redis://localhost:6379
REDIS_PROJECT_URL=redis://localhost:6380
REDIS_SPRINT_URL=redis://localhost:6381
REDIS_PIPELINE_URL=redis://localhost:6382
REDIS_ANALYTICS_URL=redis://localhost:6383

# NATS
NATS_URL=nats://localhost:4222

# JWT
JWT_SECRET=үйлдвэрлэлд-өөрчлөх-дор-хаяж-64-тэмдэгт
```

## 2-р алхам — Дэд бүтцийг ажиллуулах

```bash
docker compose up -d
```

Дараах зүйлсийг ажиллуулна:
- PostgreSQL `5432` порт дээр
- Redis × 5 `6379–6383` порт дээр
- NATS `4222` порт дээр

Бүх зүйл ажиллаж байгааг шалгах:

```bash
docker compose ps
```

## 3-р алхам — Мэдээллийн сангийн шилжилт хийх

```bash
# Бүх үйлчилгээний шилжилт хийх
cargo run -p migrations
```

Эсвэл үйлчилгээ тус бүрт:

```bash
cargo run -p auth      -- migrate
cargo run -p project   -- migrate
cargo run -p sprint    -- migrate
cargo run -p pipeline  -- migrate
cargo run -p analytics -- migrate
```

## 4-р алхам — Үйлчилгээнүүдийг ажиллуулах

Таван терминал таб нээнэ (эсвэл `overmind` процесс удирдагч ашиглана):

```bash
# 1-р таб
cargo run -p auth

# 2-р таб
cargo run -p project

# 3-р таб
cargo run -p sprint

# 4-р таб
cargo run -p pipeline

# 5-р таб
cargo run -p analytics
```

Эсвэл `Procfile`-тэй `overmind` ашиглах:

```bash
overmind start
```

## 5-р алхам — Frontend ажиллуулах

```bash
cd frontend
npm install
npm run dev
```

Апп [http://localhost:3000](http://localhost:3000) дээр нээгдэнэ.

## Хөгжүүлэлтийн ажлын урсгал

```mermaid
flowchart LR
    Edit["Rust код засах"] --> Check["cargo check\n(хурдан төрлийн шалгалт)"]
    Check --> Test["cargo test"]
    Test --> Run["cargo run -p SERVICE"]
    Run --> Try["Браузер / curl-ээр шалгах"]
    Try --> Edit
```

## Хэрэгтэй командууд

```bash
# Бүх үйлчилгээ хөрвөж байгааг шалгах
cargo check --workspace

# Бүх тест ажиллуулах
cargo test --workspace

# Форматлах
cargo fmt --all

# Lint шалгах
cargo clippy --workspace
```

## Алдаа засвар

**PostgreSQL холболт татгалзсан**
```bash
docker compose ps postgres
docker compose logs postgres
```

**Redis холболт татгалзсан**
```bash
redis-cli -p 6381 ping
# PONG буцааж ирэх ёстой
```

**Шилжилт амжилтгүй**
```bash
cargo run -p auth -- migrate status
```
