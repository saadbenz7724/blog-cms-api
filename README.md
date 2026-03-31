# 📝 Blog & Content Management REST API

A production-ready Blog CMS REST API built with **NestJS**, **MySQL**, and **Redis**. Supports three roles — Admin, Author, and Reader — with full content lifecycle management, many-to-many tags, comments with likes, and admin panel.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| NestJS + Node.js | Backend framework |
| MySQL + TypeORM | Database & ORM |
| Redis + ioredis | Caching layer |
| JWT + bcryptjs | Authentication & security |
| Passport.js | Auth strategies |
| class-validator | Request validation |

---

## ✨ Key Features

- **JWT Authentication** with refresh token rotation
- **3-Role Access Control** — Admin, Author, Reader
- **Content lifecycle** — draft → published → archived
- **Many-to-many tags** on posts with auto post count tracking
- **Full text search** on posts by title, content, excerpt
- **Comments** with like counts and soft delete
- **View count** auto increments on every post read
- **Admin panel** — user management, ban/unban, role change, content moderation
- **Redis caching** on public posts feed with automatic cache invalidation
- **Global exception filter** — consistent error format
- **Request logging** — every request logged with response time

---

## 📁 Project Structure
```
src/
├── auth/           # JWT auth, refresh tokens, login, register
├── users/          # User entity with 3 roles
├── categories/     # Post categories (admin managed)
├── tags/           # Post tags with many-to-many (admin managed)
├── posts/          # Blog posts with lifecycle management
├── comments/       # Comments with likes and soft delete
├── admin/          # Admin panel — users, posts, dashboard
├── redis/          # Redis caching service
└── common/
    ├── decorators/ # @CurrentUser(), @Roles()
    ├── guards/     # JwtAuthGuard, RolesGuard
    ├── filters/    # Global exception filter
    └── interceptors/ # Response + logging interceptors
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MySQL 8+
- Redis

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-username/blog-cms-api.git
cd blog-cms-api
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your MySQL password and secrets
```

**4. Create the database**
```sql
CREATE DATABASE blog_cms;
```

**5. Start the server**
```bash
npm run start:dev
```

Server runs at `http://localhost:5000/api/v1`

**6. Create first admin user**

Register normally then update role in MySQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Admin** | Everything — manage users, posts, comments, categories, tags |
| **Author** | Create posts, publish own posts, comment |
| **Reader** | Read posts, comment, like |

> Admin role cannot be self-registered — must be assigned via database or by another admin.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register as author or reader |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ❌ | Logout |
| GET | `/auth/me` | ✅ | Get current user |

### Categories
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/categories` | 🌐 Public | Get all categories |
| GET | `/categories/:id` | 🌐 Public | Get single category |
| POST | `/categories` | 👑 Admin | Create category |
| PATCH | `/categories/:id` | 👑 Admin | Update category |
| DELETE | `/categories/:id` | 👑 Admin | Delete category |

### Tags
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/tags` | 🌐 Public | Get all tags |
| GET | `/tags/:id` | 🌐 Public | Get single tag |
| POST | `/tags` | 👑 Admin | Create tag |
| PATCH | `/tags/:id` | 👑 Admin | Update tag |
| DELETE | `/tags/:id` | 👑 Admin | Delete tag |

### Posts
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/posts` | 🌐 Public | Get published posts (Redis cached) |
| GET | `/posts/:slug` | 🌐 Public | Get single post + auto view count |
| POST | `/posts` | ✍️ Author/Admin | Create post |
| GET | `/posts/my/posts` | ✍️ Author/Admin | Get my posts |
| PATCH | `/posts/:slug` | ✍️ Author/Admin | Update post |
| PATCH | `/posts/:slug/publish` | ✍️ Author/Admin | Publish post |
| PATCH | `/posts/:slug/archive` | ✍️ Author/Admin | Archive post |
| DELETE | `/posts/:slug` | ✍️ Author/Admin | Soft delete post |
| POST | `/posts/:slug/like` | ✅ Any | Like post |

### Posts — Query Params
```
?search=nestjs
?categoryId=1
?tagId=2
?authorId=3
?page=1&limit=10
```

### Comments
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/comments/post/:postId` | 🌐 Public | Get post comments |
| POST | `/comments` | ✅ Any | Add comment |
| PATCH | `/comments/:id` | ✅ Owner | Update own comment |
| DELETE | `/comments/:id` | ✅ Owner/Admin | Delete comment |
| POST | `/comments/:id/like` | ✅ Any | Like comment |
| GET | `/comments` | 👑 Admin | Get all comments |

### Admin Panel
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Full stats overview |
| GET | `/admin/users` | All users |
| GET | `/admin/users/:id` | User details + stats |
| PATCH | `/admin/users/:id/ban` | Ban user |
| PATCH | `/admin/users/:id/unban` | Unban user |
| PATCH | `/admin/users/:id/role` | Change user role |
| GET | `/admin/posts` | All posts including drafts |
| DELETE | `/admin/posts/:id` | Force delete post |
| GET | `/admin/comments` | All comments |
| DELETE | `/admin/comments/:id` | Force delete comment |

---

## 🔄 Content Lifecycle
```
draft → published → archived
           ↓
      (soft deleted)
```

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "path": "/api/v1/posts",
  "timestamp": "2025-03-31T10:00:00.000Z",
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied. Required role: admin",
  "errors": null,
  "path": "/api/v1/admin/users",
  "method": "GET",
  "timestamp": "2025-03-31T10:00:00.000Z"
}
```

---

## ⚡ Redis Caching Strategy

| Endpoint | Cache TTL | Invalidated When |
|---|---|---|
| `GET /posts` | 5 minutes | Post published/archived/deleted |
| Unique key per query combo | 5 minutes | Any feed change |

---

## 🗄️ Database Schema
```
users         → id, full_name, email, password, role, status, bio, avatar
refresh_tokens → id, token, user_id, expires_at, is_revoked
categories    → id, name, description, slug
tags          → id, name, slug, post_count
posts         → id, title, content, slug, excerpt, thumbnail, status,
                like_count, view_count, comment_count, published_at,
                is_deleted, author_id, category_id
post_tags     → post_id, tag_id  (many-to-many pivot)
comments      → id, content, like_count, is_deleted, user_id, post_id
```

---

## 🛡️ Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT refresh token rotation**
- **Banned users blocked** at JWT validation level
- **Admin role** cannot be self-registered
- Request body sanitized with **whitelist validation**
