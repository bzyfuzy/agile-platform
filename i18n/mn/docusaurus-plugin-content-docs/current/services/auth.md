---
id: auth
title: Auth үйлчилгээ
sidebar_position: 1
---

# Auth үйлчилгээ

Auth үйлчилгээ нь бүх таних тэмдэглэлийн асуудлыг шийддэг: бүртгэл, нэвтрэлт, JWT гаргах, OAuth2 (GitHub / Google / GitLab), API түлхүүр, байгууллагын удирдлага.

**Порт:** `8001`  
**Мэдээллийн сангийн схем:** `auth`  
**Redis:** `:6379` — сессүүд, JWT хар жагсаалт, хурдны хязгаарлалт, эрхийн кэш

## Нэвтрэлтийн урсгал

```mermaid
sequenceDiagram
    autonumber
    participant C as Клиент
    participant GW as API Gateway
    participant A as Auth үйлчилгээ
    participant R as Redis :6379
    participant DB as PostgreSQL auth.*

    C->>GW: POST /auth/login {email, password}
    GW->>A: хүсэлт дамжуулах
    A->>DB: SELECT users WHERE email = ?
    DB-->>A: хэрэглэгчийн мөр
    A->>A: argon2::verify(password, hash)
    alt Буруу нэвтрэх мэдээлэл
        A-->>GW: 401 Зөвшөөрөгдөөгүй
        GW-->>C: 401
    else Зөв
        A->>A: JWT (15м) + refresh token (7х) үүсгэх
        A->>R: SET session:user_id {data} EX 86400
        A->>R: SET refresh:token {user_id} EX 604800
        A-->>GW: 200 {access_token, refresh_token}
        GW-->>C: 200 OK
    end
```

## Token сэргээх урсгал

```mermaid
sequenceDiagram
    participant C as Клиент
    participant A as Auth үйлчилгээ
    participant R as Redis :6379

    C->>A: POST /auth/refresh {refresh_token}
    A->>R: GET refresh:token
    alt Token олдсонгүй эсвэл хугацаа дууссан
        R-->>A: nil
        A-->>C: 401 — дахин нэвтрэх шаардлагатай
    else Хүчинтэй
        R-->>A: user_id
        A->>A: шинэ JWT (15м) үүсгэх
        A-->>C: 200 {access_token}
    end
```

## API endpoint-үүд

| Арга | Зам | Тайлбар |
|---|---|---|
| `POST` | `/auth/register` | Шинэ хэрэглэгч + байгууллага бүртгэх |
| `POST` | `/auth/login` | Email/нууц үгээр нэвтрэх |
| `POST` | `/auth/refresh` | Access token сэргээх |
| `POST` | `/auth/logout` | Сессийг цуцлах |
| `GET` | `/auth/me` | Одоогийн хэрэглэгчийн профайл |
| `GET` | `/auth/oauth/:provider` | OAuth2 урсгал эхлүүлэх |
| `POST` | `/auth/api-keys` | API түлхүүр үүсгэх |
| `DELETE` | `/auth/api-keys/:id` | API түлхүүр цуцлах |

## JWT бүтэц

```json
{
  "sub": "018e4b2a-uuid-хэрэглэгч-id",
  "org": "018e4b2a-uuid-байгууллага-id",
  "role": "admin",
  "jti": "018e4b2a-uuid-token-id",
  "iat": 1712000000,
  "exp": 1712000900
}
```

:::tip Богино хугацаатай access token
Access token **15 минут**-д хугацаа дуусна. Энэ нь алдагдсан token-ий хохирлыг хязгаарладаг. Refresh token (7 хоног) нь `httpOnly` хэлбэрээр хадгалагдаж, JavaScript-ээс хандах боломжгүй.
:::
