# Kavya SaaS Platform — Full-Stack Architecture & Documentation
### Rekhta.org-Inspired Literary & Poetry SaaS Platform

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [User Roles & RBAC](#5-user-roles--rbac)
6. [API Design](#6-api-design)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Content Management System](#9-content-management-system)
10. [Search & Discovery Engine](#10-search--discovery-engine)
11. [Subscription & Billing](#11-subscription--billing)
12. [Media & File Storage](#12-media--file-storage)
13. [Notifications System](#13-notifications-system)
14. [Analytics & Reporting](#14-analytics--reporting)
15. [Deployment & DevOps](#15-deployment--devops)
16. [Security Guidelines](#16-security-guidelines)
17. [Environment Variables](#17-environment-variables)
18. [API Reference](#18-api-reference)

---

## 1. Product Overview

**Kavya** is a multi-tenant SaaS platform for literary content — poetry, ghazals, shayari, prose, and stories. Inspired by Rekhta.org, it enables publishers to host, curate, and monetize literary content with full multilingual support (Hindi, Urdu, English, and regional Indian languages).

### Core Features
- Multi-language poetry & literary content hosting
- Audio/video recitations with streaming
- Poet & author profiles with verified badges
- Collections, anthologies, and curated playlists
- Community features: comments, likes, bookmarks, following
- Advanced search with transliteration support
- Subscription tiers for readers and publishers
- Admin CMS with content moderation workflow
- Analytics dashboard for publishers
- REST + GraphQL API for third-party integrations
- Mobile apps (React Native)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Web App (Next.js)  │  Mobile (React Native)  │  Admin Panel  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────────────────┐
│                    CDN + WAF LAYER                              │
│              Cloudflare (CDN, WAF, DDoS Protection)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                   API GATEWAY LAYER                             │
│    Kong / AWS API Gateway  │  Rate Limiting  │  JWT Validation  │
└──────────┬───────────────────────────────────┬──────────────────┘
           │                                   │
┌──────────▼──────────┐            ┌───────────▼──────────────────┐
│   CORE API SERVICE  │            │    MEDIA SERVICE             │
│   (Node.js/NestJS)  │            │    (Go / Fastify)            │
│   Port: 3001        │            │    Port: 3002                │
└──────────┬──────────┘            └───────────┬──────────────────┘
           │                                   │
┌──────────▼──────────┐            ┌───────────▼──────────────────┐
│   DATA LAYER        │            │    STORAGE LAYER             │
│   PostgreSQL (RDS)  │            │    AWS S3 / Cloudinary       │
│   Redis (ElastiCache│            │    Audio/Video CDN           │
│   Elasticsearch     │            │    Image Optimization        │
└─────────────────────┘            └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   BACKGROUND SERVICES                           │
│  Bull Queue (Redis)  │  Email (SendGrid)  │  Analytics (Kafka)  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Microservices Breakdown

| Service | Language | Responsibility | Port |
|---------|----------|----------------|------|
| API Gateway | Kong | Routing, Auth, Rate limiting | 8000 |
| Core API | Node.js/NestJS | Business logic, CRUD | 3001 |
| Media Service | Go | File upload, transcoding | 3002 |
| Search Service | Node.js | Elasticsearch wrapper | 3003 |
| Auth Service | Node.js | JWT, OAuth, Sessions | 3004 |
| Notification Service | Node.js | Email, Push, In-app | 3005 |
| Analytics Service | Python | Events, Reports, Dashboards | 3006 |
| Admin Service | Node.js | CMS, Moderation | 3007 |

### 2.3 Event-Driven Architecture

```
Core API → Kafka Producer → Topics:
  - content.published
  - user.registered
  - subscription.changed
  - content.viewed
  - content.liked
  - comment.created

Kafka Consumers:
  - Analytics Service (all events)
  - Notification Service (user.*, content.published)
  - Search Service (content.*)
  - Email Service (subscription.*, user.registered)
```

---

## 3. Technology Stack

### 3.1 Backend
```
Runtime:         Node.js 20 LTS
Framework:       NestJS 10 (TypeScript)
ORM:             Prisma 5
Database:        PostgreSQL 16 (Primary), Redis 7 (Cache/Queue)
Search:          Elasticsearch 8
Queue:           Bull (Redis-backed)
Auth:            Passport.js + JWT + OAuth2 (Google, GitHub)
Validation:      class-validator, Zod
API Docs:        Swagger / OpenAPI 3.0
Testing:         Jest + Supertest
Media:           FFmpeg (audio/video), Sharp (images)
```

### 3.2 Frontend
```
Framework:       Next.js 14 (App Router)
Language:        TypeScript 5
Styling:         Tailwind CSS + Radix UI
State:           Zustand + React Query (TanStack)
Forms:           React Hook Form + Zod
Auth:            NextAuth.js
Fonts:           Google Fonts (Noto Nastaliq Urdu, Lohit Devanagari)
Animation:       Framer Motion
Testing:         Vitest + Playwright (E2E)
```

### 3.3 Mobile
```
Framework:       React Native 0.73 + Expo
Navigation:      React Navigation 6
State:           Zustand
API:             Axios + React Query
Offline:         WatermelonDB (local SQLite)
```

### 3.4 Infrastructure
```
Cloud:           AWS (primary) + Cloudflare
Container:       Docker + Kubernetes (EKS)
CI/CD:           GitHub Actions + ArgoCD
IaC:             Terraform
Monitoring:      Datadog / Prometheus + Grafana
Logging:         ELK Stack (Elasticsearch, Logstash, Kibana)
Secrets:         AWS Secrets Manager
```

---

## 4. Database Schema

### 4.1 Core Tables (PostgreSQL)

#### `users` table
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  username        VARCHAR(50) UNIQUE NOT NULL,
  display_name    VARCHAR(100),
  password_hash   VARCHAR(255),
  avatar_url      TEXT,
  bio             TEXT,
  language_prefs  VARCHAR(10)[] DEFAULT ARRAY['en'],
  role            user_role NOT NULL DEFAULT 'reader',
  status          user_status NOT NULL DEFAULT 'active',
  is_verified     BOOLEAN DEFAULT FALSE,
  email_verified  BOOLEAN DEFAULT FALSE,
  oauth_provider  VARCHAR(50),
  oauth_id        VARCHAR(255),
  tenant_id       UUID REFERENCES tenants(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'
);

CREATE TYPE user_role AS ENUM (
  'superadmin', 'admin', 'editor', 'publisher', 'poet', 'reader'
);
CREATE TYPE user_status AS ENUM (
  'active', 'inactive', 'suspended', 'pending_verification'
);
```

#### `tenants` table (Multi-tenancy)
```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  domain        VARCHAR(255),
  logo_url      TEXT,
  plan          subscription_plan DEFAULT 'free',
  settings      JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `content` table
```sql
CREATE TABLE content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(500) NOT NULL,
  slug            VARCHAR(500) UNIQUE NOT NULL,
  body            TEXT,
  body_urdu       TEXT,
  body_hindi      TEXT,
  excerpt         TEXT,
  content_type    content_type NOT NULL,
  language        VARCHAR(10) NOT NULL DEFAULT 'ur',
  author_id       UUID NOT NULL REFERENCES users(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  collection_id   UUID REFERENCES collections(id),
  cover_image_url TEXT,
  audio_url       TEXT,
  video_url       TEXT,
  status          content_status NOT NULL DEFAULT 'draft',
  is_premium      BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,
  view_count      BIGINT DEFAULT 0,
  like_count      BIGINT DEFAULT 0,
  bookmark_count  BIGINT DEFAULT 0,
  tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata        JSONB DEFAULT '{}',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TYPE content_type AS ENUM (
  'poem', 'ghazal', 'nazm', 'sher', 'qita',
  'story', 'essay', 'translation', 'article'
);
CREATE TYPE content_status AS ENUM (
  'draft', 'review', 'approved', 'published', 'rejected', 'archived'
);
```

#### `collections` table
```sql
CREATE TABLE collections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(300) NOT NULL,
  slug          VARCHAR(300) UNIQUE NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  curator_id    UUID NOT NULL REFERENCES users(id),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  is_public     BOOLEAN DEFAULT TRUE,
  is_featured   BOOLEAN DEFAULT FALSE,
  content_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `subscriptions` table
```sql
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  plan              subscription_plan NOT NULL,
  status            sub_status NOT NULL DEFAULT 'active',
  stripe_sub_id     VARCHAR(255),
  stripe_cust_id    VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE sub_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');
```

#### `comments` table
```sql
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  UUID NOT NULL REFERENCES content(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  parent_id   UUID REFERENCES comments(id),
  body        TEXT NOT NULL,
  status      comment_status DEFAULT 'visible',
  like_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'flagged', 'deleted');
```

#### `follows` table
```sql
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
```

#### `bookmarks` table
```sql
CREATE TABLE bookmarks (
  user_id     UUID NOT NULL REFERENCES users(id),
  content_id  UUID NOT NULL REFERENCES content(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id)
);
```

#### `permissions` & `role_permissions` tables
```sql
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,  -- e.g. 'content:publish'
  description TEXT,
  module      VARCHAR(50)  -- e.g. 'content', 'users', 'analytics'
);

CREATE TABLE role_permissions (
  role        user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id),
  tenant_id   UUID REFERENCES tenants(id),  -- NULL = global
  PRIMARY KEY (role, permission_id)
);
```

#### `audit_logs` table
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  tenant_id   UUID REFERENCES tenants(id),
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100),
  resource_id UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Redis Data Structures
```
Sessions:         sessions:{userId}          → JWT + user data (TTL: 7d)
Rate Limiting:    ratelimit:{ip}:{endpoint}  → request count (TTL: 1min)
Content Cache:    content:{slug}             → serialized content (TTL: 1h)
Search Cache:     search:{hash}              → results (TTL: 5min)
User Feed:        feed:{userId}              → sorted set of content IDs
Online Users:     online:users              → set of user IDs
View Count:       views:{contentId}          → counter (batch flush to PG)
```

---

## 5. User Roles & RBAC

### 5.1 Role Hierarchy

```
SUPERADMIN
  └── ADMIN (per tenant)
        ├── EDITOR
        │     └── (can approve content)
        ├── PUBLISHER
        │     └── (can publish own content)
        └── POET / AUTHOR
              └── (can create own content)
READER (default)
```

### 5.2 Role Definitions & Permissions Matrix

| Permission | superadmin | admin | editor | publisher | poet | reader |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **USERS** | | | | | | |
| users:list | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| users:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:update | ✅ | ✅(own tenant) | ❌ | ❌ | ❌ | ❌ |
| users:delete | ✅ | ✅(own tenant) | ❌ | ❌ | ❌ | ❌ |
| users:assign_role | ✅ | ✅(limited) | ❌ | ❌ | ❌ | ❌ |
| **CONTENT** | | | | | | |
| content:create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| content:read_public | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| content:read_premium | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(subsc) |
| content:update_own | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| content:update_any | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| content:delete_own | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| content:delete_any | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| content:publish | ✅ | ✅ | ✅ | ✅(own) | ❌ | ❌ |
| content:approve | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| content:feature | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **COLLECTIONS** | | | | | | |
| collection:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| collection:manage | ✅ | ✅ | ✅ | ✅(own) | ✅(own) | ✅(own) |
| collection:feature | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **COMMENTS** | | | | | | |
| comment:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| comment:delete_own | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| comment:moderate | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **ANALYTICS** | | | | | | |
| analytics:own | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| analytics:tenant | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| analytics:global | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TENANTS** | | | | | | |
| tenant:create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| tenant:settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| tenant:billing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SUBSCRIPTIONS** | | | | | | |
| subscription:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| subscription:view_own | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 5.3 RBAC Implementation

```typescript
// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// src/auth/decorators/permissions.decorator.ts
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// src/auth/guards/rbac.guard.ts
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    return this.permissionsService.hasPermissions(
      user.id,
      user.role,
      user.tenantId,
      requiredPermissions
    );
  }
}

// Usage in controllers:
@Post('/publish/:id')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('content:publish')
async publishContent(@Param('id') id: string, @CurrentUser() user: User) {
  return this.contentService.publish(id, user);
}
```

### 5.4 Resource-Level Authorization

For content ownership checks (update/delete own vs any):

```typescript
// src/common/guards/ownership.guard.ts
@Injectable()
export class OwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Superadmin and Admin bypass ownership checks
    if (['superadmin', 'admin', 'editor'].includes(user.role)) return true;

    const resource = await this.resourceService.findById(resourceId);
    if (!resource) throw new NotFoundException();

    return resource.authorId === user.id;
  }
}
```

---

## 6. API Design

### 6.1 Base URL Structure
```
Production:    https://api.kavya.io/v1
Staging:       https://api.staging.kavya.io/v1
Local:         http://localhost:3001/v1
```

### 6.2 Authentication Endpoints

```
POST   /v1/auth/register          Register new user
POST   /v1/auth/login             Login with email/password
POST   /v1/auth/logout            Logout (invalidate token)
POST   /v1/auth/refresh           Refresh access token
POST   /v1/auth/forgot-password   Send reset email
POST   /v1/auth/reset-password    Reset with token
GET    /v1/auth/me                Get current user
POST   /v1/auth/google            OAuth2 Google
POST   /v1/auth/verify-email      Verify email with OTP
```

### 6.3 Content Endpoints

```
GET    /v1/content                List content (paginated, filtered)
GET    /v1/content/:slug          Get single content by slug
POST   /v1/content                Create new content (auth required)
PUT    /v1/content/:id            Update content
DELETE /v1/content/:id            Delete content
POST   /v1/content/:id/publish    Publish content
POST   /v1/content/:id/like       Toggle like
POST   /v1/content/:id/bookmark   Toggle bookmark
GET    /v1/content/:id/comments   Get comments for content
GET    /v1/content/feed           Get personalized feed (auth)
GET    /v1/content/trending       Get trending content
GET    /v1/content/featured       Get featured content
```

### 6.4 Users Endpoints

```
GET    /v1/users/:username        Get user profile
GET    /v1/users/:id/content      Get user's content
GET    /v1/users/:id/collections  Get user's collections
POST   /v1/users/:id/follow       Follow user
DELETE /v1/users/:id/follow       Unfollow user
GET    /v1/users/:id/followers    Get followers
GET    /v1/users/:id/following    Get following
PUT    /v1/users/me               Update own profile
PUT    /v1/users/me/password      Change password
```

### 6.5 Admin Endpoints

```
GET    /v1/admin/users            List all users (admin only)
PUT    /v1/admin/users/:id/role   Change user role
PUT    /v1/admin/users/:id/status Suspend/activate user
GET    /v1/admin/content          List all content with filters
PUT    /v1/admin/content/:id/status Approve/reject content
GET    /v1/admin/analytics        Global analytics
GET    /v1/admin/tenants          List all tenants
POST   /v1/admin/tenants          Create new tenant
```

### 6.6 Standard Request/Response Format

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept-Language: ur, hi, en
X-Tenant-ID: <tenant_uuid>
```

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 450,
    "totalPages": 23
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "Content with given ID not found",
    "details": null,
    "statusCode": 404
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 6.7 Rate Limiting

| Endpoint Category | Authenticated | Unauthenticated |
|-------------------|--------------|-----------------|
| GET (read) | 1000/min | 100/min |
| POST/PUT/DELETE | 100/min | 10/min |
| Auth endpoints | 20/min | 5/min |
| Search | 200/min | 30/min |
| Media upload | 20/min | Blocked |
| Admin endpoints | 500/min | Blocked |

---

## 7. Frontend Architecture

### 7.1 Next.js App Structure
```
/src
  /app                        # App Router pages
    /(auth)
      /login                  # Login page
      /register               # Registration
      /forgot-password
    /(dashboard)
      /dashboard              # User dashboard (layout)
      /dashboard/my-content
      /dashboard/analytics
      /dashboard/settings
    /(admin)
      /admin                  # Admin panel (layout)
      /admin/users
      /admin/content
      /admin/analytics
    /[lang]                   # Localized routes
      /[contentType]
        /[slug]               # Content detail page
    /poets/[username]         # Poet profile
    /collections
    /search
  /components
    /ui                       # Base UI components
    /content                  # Content-specific components
    /layout                   # Header, Footer, Sidebar
    /auth                     # Auth forms
    /admin                    # Admin components
  /hooks                      # Custom React hooks
  /store                      # Zustand stores
  /lib                        # Utilities, API client
  /types                      # TypeScript types
  /i18n                       # Internationalization
```

### 7.2 State Management

```typescript
// store/auth.store.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 7.3 API Client

```typescript
// lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh, else logout
      await refreshToken();
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Authentication & Authorization

### 8.1 JWT Token Strategy

```
Access Token:
  - Expiry: 15 minutes
  - Payload: { sub, email, role, tenantId, permissions[] }
  - Stored: Memory (not localStorage)

Refresh Token:
  - Expiry: 7 days
  - Stored: HttpOnly Cookie (SameSite=Strict)
  - Rotated on every use (refresh token rotation)

Token Blacklist:
  - Redis SET: blacklist:{tokenJti}  TTL = token remaining TTL
  - Checked on every request
```

### 8.2 OAuth2 Flow (Google)

```
1. User clicks "Login with Google"
2. Frontend → GET /auth/google (redirect to Google OAuth consent)
3. Google → Callback to /auth/google/callback?code=xxx
4. Backend exchanges code for tokens
5. Fetch user info from Google
6. Find or create user in DB
7. Issue our own JWT pair
8. Redirect to frontend with access_token in URL fragment
9. Frontend extracts token, stores in memory
```

### 8.3 Multi-Tenant Auth

```typescript
// JWT payload includes tenantId
// Middleware validates:
// 1. Token is valid and not blacklisted
// 2. User belongs to tenant in request (X-Tenant-ID header)
// 3. User's role and permissions are checked per-tenant

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    const user = request.user;

    if (user.role === 'superadmin') return true; // bypass
    return user.tenantId === tenantId;
  }
}
```

---

## 9. Content Management System

### 9.1 Content Workflow

```
DRAFT → REVIEW → APPROVED → PUBLISHED
         ↓
       REJECTED (with reason)
         ↓
      DRAFT (author can revise)
```

### 9.2 Content Moderation Rules

- All content from `poet` role goes to `REVIEW` before publishing
- Content from `publisher`/`editor`/`admin` can self-publish
- Flagged content auto-hides after 5 community reports
- AI content check on submission (profanity, spam detection)
- Manual review queue for admin/editor

### 9.3 Rich Text & Multilingual Support

Content fields support:
- `body` — primary content (RTL for Urdu)
- `body_hindi` — Hindi Devanagari transliteration
- `body_roman` — Roman Urdu transliteration (auto-generated)
- `body_english` — English translation

Transliteration engine: Custom Node.js module using Urdu-to-Roman mapping tables.

---

## 10. Search & Discovery Engine

### 10.1 Elasticsearch Index Mapping

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "urdu_analyzer",
        "fields": {
          "roman": { "type": "text", "analyzer": "roman_urdu" },
          "english": { "type": "text", "analyzer": "english" }
        }
      },
      "body": { "type": "text", "analyzer": "urdu_analyzer" },
      "tags": { "type": "keyword" },
      "author_name": { "type": "text" },
      "content_type": { "type": "keyword" },
      "language": { "type": "keyword" },
      "is_premium": { "type": "boolean" },
      "view_count": { "type": "long" },
      "like_count": { "type": "long" },
      "published_at": { "type": "date" }
    }
  }
}
```

### 10.2 Search Features

- Full-text search with Urdu stemming
- Transliteration search (type Roman, find Urdu)
- Tag-based filtering
- Author search
- Content type filtering
- Faceted search (language, type, era, poet)
- Autocomplete suggestions
- Search result highlighting
- "Did you mean?" spell correction

---

## 11. Subscription & Billing

### 11.1 Plans

| Feature | Free | Basic (₹99/mo) | Premium (₹299/mo) | Enterprise |
|---------|------|-----------------|-------------------|------------|
| Content access | Public only | All content | All + offline | All + API |
| Downloads | ❌ | ❌ | ✅ | ✅ |
| Audio streaming | Limited | ✅ | ✅ HQ | ✅ |
| Bookmarks | 20 | Unlimited | Unlimited | Unlimited |
| Collections | 5 | Unlimited | Unlimited | Unlimited |
| Ad-free | ❌ | ✅ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |

### 11.2 Stripe Integration

```typescript
// Webhook events handled:
customer.subscription.created    → activate subscription
customer.subscription.updated    → update plan
customer.subscription.deleted    → deactivate
invoice.payment_succeeded        → mark paid
invoice.payment_failed           → notify user, retry
customer.subscription.trial_will_end → notify user
```

---

## 12. Media & File Storage

### 12.1 File Upload Flow

```
1. Client requests pre-signed URL from /media/presign
2. Backend validates user permissions & file type
3. Backend generates S3 pre-signed URL (expires: 15min)
4. Client uploads directly to S3
5. Client notifies backend with S3 key
6. Backend queues processing job (Bull queue)
7. Media worker processes file (resize, transcode, etc.)
8. Processed file URL saved to DB
9. WebSocket event sent to client: "media.ready"
```

### 12.2 Allowed File Types & Limits

| Type | Formats | Max Size | Processing |
|------|---------|---------|------------|
| Image | JPEG, PNG, WebP | 10 MB | Resize to 1200px, WebP conversion |
| Audio | MP3, WAV, FLAC, OGG | 100 MB | Transcode to MP3 128k + HQ |
| Video | MP4, MOV, WebM | 500 MB | HLS streaming, thumbnails |
| Document | PDF | 20 MB | Text extraction for search |

---

## 13. Notifications System

### 13.1 Notification Types

```typescript
enum NotificationType {
  NEW_FOLLOWER       = 'new_follower',
  CONTENT_LIKED      = 'content_liked',
  CONTENT_COMMENTED  = 'content_commented',
  COMMENT_REPLIED    = 'comment_replied',
  CONTENT_PUBLISHED  = 'content_published',
  CONTENT_APPROVED   = 'content_approved',
  CONTENT_REJECTED   = 'content_rejected',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}
```

### 13.2 Delivery Channels

- In-app notifications (WebSocket + Redis pub/sub)
- Email (SendGrid templates)
- Push notifications (Firebase FCM for mobile)
- User preferences control each channel per type

---

## 14. Analytics & Reporting

### 14.1 Events Tracked

```
content_view:    contentId, userId?, sessionId, source, duration
content_like:    contentId, userId
content_share:   contentId, platform
search_query:    query, results_count, filters
audio_play:      contentId, userId, duration
user_signup:     source, plan
subscription_*:  plan, amount
```

### 14.2 Dashboard Metrics

**Poet/Publisher Dashboard:**
- Total views, likes, bookmarks per content
- Follower growth over time
- Top performing content
- Audience language/location breakdown
- Revenue from premium content

**Admin Dashboard:**
- Total users, DAU/MAU
- Content published per day
- Subscription MRR/ARR
- Search analytics
- Content moderation queue stats

---

## 15. Deployment & DevOps

### 15.1 Docker Compose (Development)

```yaml
version: '3.9'
services:
  api:
    build: ./apps/api
    ports: ['3001:3001']
    environment:
      DATABASE_URL: postgresql://postgres:secret@postgres:5432/kavya
      REDIS_URL: redis://redis:6379
    depends_on: [postgres, redis, elasticsearch]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kavya
      POSTGRES_PASSWORD: secret
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"

  kibana:
    image: kibana:8.11.0
    ports: ['5601:5601']

volumes:
  pg_data:
  redis_data:
```

### 15.2 Kubernetes Architecture

```yaml
# Namespaces: production, staging, monitoring
# Deployments: api, media-service, worker, admin
# Services: ClusterIP for internal, LoadBalancer for public
# HPA: CPU 70% → scale up (min 2, max 10 replicas)
# PodDisruptionBudget: min 1 available during rolling updates
```

### 15.3 CI/CD Pipeline

```yaml
# GitHub Actions Workflow
on: [push to main/staging]

jobs:
  test:       Run unit + integration tests
  lint:       ESLint + TypeScript check
  build:      Docker build + push to ECR
  migrate:    Run Prisma migrations (staging first)
  deploy:     ArgoCD sync to K8s cluster
  smoke:      Run smoke tests against deployment
  notify:     Slack notification on success/failure
```

---

## 16. Security Guidelines

### 16.1 Application Security

- All inputs validated and sanitized (class-validator + Zod)
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via CSP headers + input sanitization
- CSRF protection via SameSite cookies + CSRF tokens
- Rate limiting on all endpoints
- JWT tokens in memory (not localStorage)
- Refresh tokens in HttpOnly cookies
- Password hashing: bcrypt (cost factor 12)
- API key rotation policy (every 90 days)

### 16.2 Infrastructure Security

- VPC with private subnets for DB/cache
- Security groups: minimal required ports
- WAF rules: OWASP Core Rule Set
- Secrets in AWS Secrets Manager (never in env files)
- KMS encryption for S3 buckets
- TLS 1.3 enforced on all endpoints
- Regular security scans: Snyk, OWASP ZAP

### 16.3 Data Privacy (GDPR / PDPB)

- User data export endpoint (GDPR Article 20)
- Account deletion with full data wipe (Article 17)
- Consent management for cookies & marketing
- Data retention policy: logs kept 90 days
- PII encryption at rest (AES-256)

---

## 17. Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3001
APP_URL=https://kavya.io
API_URL=https://api.kavya.io

# Database
DATABASE_URL=postgresql://user:pass@host:5432/kavya?schema=public
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://user:pass@host:6379

# Authentication
JWT_ACCESS_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<256-bit-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=kavya-media-prod

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@kavya.io

# Elasticsearch
ELASTICSEARCH_URL=https://elastic:pass@host:9200

# Firebase (Push notifications)
FIREBASE_PROJECT_ID=kavya-prod
FIREBASE_CLIENT_EMAIL=xxx@kavya-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxx

# Cloudflare
CLOUDFLARE_ZONE_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
```

---

## 18. API Reference

### 18.1 Create Content

**POST /v1/content**

```json
Request:
{
  "title": "دل میں اک لہر سی اٹھی ہے ابھی",
  "body": "دل میں اک لہر سی اٹھی ہے ابھی\nسامنے تم کوئی نہیں لیکن...",
  "contentType": "ghazal",
  "language": "ur",
  "tags": ["ishq", "dard", "ghalib"],
  "isPremium": false,
  "collectionId": "uuid-optional"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "dil-mein-ek-leher-si-uthi-hai-abhi",
    "status": "review",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 18.2 Search Content

**GET /v1/search?q=ghalib&type=ghazal&lang=ur&page=1&limit=20**

```json
Response 200:
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "...",
        "title": "...",
        "slug": "...",
        "excerpt": "...",
        "author": { "username": "...", "displayName": "..." },
        "contentType": "ghazal",
        "likeCount": 1240,
        "highlight": {
          "title": ["<em>Ghalib</em> ki shayari..."],
          "body": ["..."]
        }
      }
    ],
    "total": 156,
    "suggestions": ["ghalib ki ghazalein", "ghalib shayari urdu"]
  },
  "meta": { "page": 1, "limit": 20, "totalPages": 8 }
}
```

---

*Documentation Version: 1.0.0*
*Last Updated: 2024-01-15*
*Maintained by: Platform Engineering Team*

> For questions, open an issue at github.com/your-org/kavya-platform or contact platform-eng@kavya.io
