# 🌳 Mangrove Guardian AI - Project Architecture

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [System Components](#system-components)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication Flow](#authentication-flow)
7. [Data Flow](#data-flow)
8. [File Structure](#file-structure)
9. [Deployment Architecture](#deployment-architecture)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Tailwind CSS (Vite)               │  │
│  │  • Landing Page                                          │  │
│  │  • Authentication (Login/Register)                       │  │
│  │  • Dashboard (Community & Organization)                  │  │
│  │  • Report Form & Map                                     │  │
│  │  • Restoration Projects                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY / NGINX (Production)              │
│              (Port 80/443 → Backend Port 8000)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (Backend)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Django 6.0 + Django REST Framework (Gunicorn)          │  │
│  │  Port: 8000                                              │  │
│  │                                                          │  │
│  │  ├─ Auth Service (JWT)                                  │  │
│  │  │  └─ Login, Register, Token Refresh                   │  │
│  │  │                                                      │  │
│  │  ├─ Report Module                                       │  │
│  │  │  ├─ Report CRUD                                      │  │
│  │  │  ├─ Report Analysis (AI Processing)                  │  │
│  │  │  └─ Export Reports (Excel)                           │  │
│  │  │                                                      │  │
│  │  ├─ Restoration Module                                  │  │
│  │  │  ├─ Projects CRUD                                    │  │
│  │  │  ├─ Events Management                                │  │
│  │  │  └─ Public Project List                              │  │
│  │  │                                                      │  │
│  │  ├─ Analysis Module                                     │  │
│  │  │  ├─ AI Analysis Tasks                                │  │
│  │  │  ├─ Result Caching                                   │  │
│  │  │  └─ Health Score Calculation                         │  │
│  │  │                                                      │  │
│  │  └─ User Module                                         │  │
│  │     ├─ User Management                                  │  │
│  │     ├─ Role-Based Access (Community/Organization)       │  │
│  │     └─ Approval Workflow                                │  │
│  │                                                          │  │
│  │  ⚡ Rate Limiting (Throttling)                          │  │
│  │     • AuthThrottle: 5/min (login/register)             │  │
│  │     • ImageAnalysisThrottle: 20/day                     │  │
│  │     • GeneralThrottle: 100/hour                         │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│        ┌────────────────┼────────────────┬────────────┐        │
│        │                │                │            │        │
│        ▼                ▼                ▼            ▼        │
│   ┌────────┐      ┌──────────┐    ┌───────────┐  ┌────────┐  │
│   │Cache   │      │Task Queue│    │File Store │  │Logger  │  │
│   │Layer   │      │(Celery)  │    │(Cloudinary)  │        │  │
│   └────────┘      └──────────┘    └───────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │                   │                │
        ▼                   ▼                ▼
    ┌────────┐          ┌────────┐      ┌──────────┐
    │ Redis  │          │Celery  │      │Cloudinary│
    │6379    │          │Worker  │      │API       │
    └────────┘          └────────┘      └──────────┘
        │                   │
        ▼                   ▼
    ┌────────────────────────────────┐
    │  Data & Task Storage Layer     │
    │                                │
    │  ┌──────────────┐              │
    │  │ PostgreSQL   │ (Primary DB) │
    │  │ Port: 5432   │              │
    │  └──────────────┘              │
    │                                │
    └────────────────────────────────┘
```

---

## System Components

### Frontend (React + TypeScript)
```
Frontend/
├── Pages
│   ├── public/LandingPage.tsx       - Marketing page with stats
│   ├── auth/LoginPage.tsx           - User login
│   ├── auth/RegisterPage.tsx        - User registration
│   ├── dashboard/Dashboard.tsx      - Main dashboard (role-based)
│   ├── reports/ReportForm.tsx       - Report submission
│   └── restoration/index.tsx        - Project management
│
├── Components
│   ├── ReportMap.tsx                - Leaflet map integration
│   ├── RateLimitNotification.tsx    - Error notifications
│   ├── StatCard.tsx                 - Statistics display
│   └── EmptyState.tsx               - Empty state UI
│
├── API Layer
│   ├── api/axios.ts                 - Axios instance + interceptors
│   ├── api/auth.ts                  - Auth endpoints
│   └── services/auth.ts             - Auth logic
│
└── Hooks
    ├── useAuth.ts                   - Authentication state
    └── useDashboard.ts              - Dashboard data
```

### Backend (Django + DRF)
```
Backend/
├── config/
│   ├── settings.py                  - Django configuration
│   ├── urls.py                      - URL routing
│   ├── wsgi.py                      - WSGI for Gunicorn
│   ├── asgi.py                      - ASGI for async
│   └── celery.py                    - Celery configuration
│
├── apps/
│   ├── users/
│   │   ├── models.py                - User model + roles
│   │   ├── views.py                 - Authentication views
│   │   ├── serializers.py           - User serializers
│   │   └── urls.py                  - Auth endpoints
│   │
│   ├── reports/
│   │   ├── models.py                - Report model
│   │   ├── views.py                 - Report CRUD
│   │   ├── serializers.py           - Report serializers
│   │   └── urls.py                  - Report endpoints
│   │
│   ├── analysis/
│   │   ├── models.py                - Analysis model
│   │   ├── views.py                 - Analysis API
│   │   ├── serializers.py           - Analysis serializers
│   │   ├── tasks.py                 - Celery tasks (AI)
│   │   └── urls.py                  - Analysis endpoints
│   │
│   ├── restoration/
│   │   ├── models.py                - Project & Event models
│   │   ├── views.py                 - Project management
│   │   ├── serializers.py           - Project serializers
│   │   └── urls.py                  - Project endpoints
│   │
│   └── core/
│       └── throttles.py             - Rate limiting classes
│
├── migrations/
│   └── [auto-generated]
│
└── manage.py
```

---

## Technology Stack

### Frontend
```
├─ Framework
│  ├─ React 18+
│  ├─ TypeScript (strict mode)
│  └─ Vite (build tool)
│
├─ Styling
│  └─ Tailwind CSS v3+ (with eco-theme palette)
│
├─ State Management
│  ├─ React Hooks (useState, useEffect, useMemo)
│  ├─ Context API (Authentication)
│  └─ Local Storage (Tokens)
│
├─ HTTP Client
│  └─ Axios (with JWT interceptors)
│
├─ UI Libraries
│  ├─ React Router (navigation)
│  ├─ React Leaflet (maps)
│  └─ Custom SVG Icons (11 eco-themed)
│
└─ Development
   ├─ ESLint
   ├─ TypeScript Compiler
   └─ Vite Dev Server (Hot reload)
```

### Backend
```
├─ Framework
│  ├─ Django 6.0
│  ├─ Django REST Framework
│  └─ Python 3.11
│
├─ Database
│  ├─ PostgreSQL 15 (Primary)
│  └─ SQLite (Development)
│
├─ Caching & Queue
│  ├─ Redis 7 (Cache + Celery broker)
│  ├─ django-redis
│  └─ Celery (Task queue)
│
├─ Authentication
│  ├─ Django JWT (djangorestframework-simplejwt)
│  └─ Custom User model with roles
│
├─ File Storage
│  └─ Cloudinary (CDN + image processing)
│
├─ Rate Limiting
│  ├─ Custom throttle classes
│  ├─ Redis-backed (distributed)
│  └─ 3-tier strategy (auth, analysis, general)
│
├─ Task Scheduling
│  ├─ Celery Beat (scheduler)
│  └─ django-celery-beat
│
├─ Production Server
│  └─ Gunicorn + Nginx (Docker)
│
└─ Monitoring
   ├─ Python logging
   └─ JSON file logs
```

### Infrastructure (Docker)
```
├─ Containers
│  ├─ Django (Port 8000) - Gunicorn WSGI
│  ├─ PostgreSQL (Port 5432) - Persistent DB
│  ├─ Redis (Port 6379) - Cache & broker
│  ├─ Celery Worker - Async tasks
│  ├─ Celery Beat - Scheduled tasks
│  ├─ React Dev (Port 5173) - Vite server
│  └─ Nginx (Port 80/443) - Reverse proxy (prod)
│
├─ Volumes
│  ├─ postgres_data - Database persistence
│  ├─ redis_data - Cache persistence
│  ├─ static_volume - Django static files
│  └─ media_volume - User uploads
│
└─ Networking
   └─ mangrove_network (Bridge network)
```

---

## Database Schema

### User Model
```
User (Custom)
├─ id: Primary Key
├─ username: String (unique)
├─ email: String (unique)
├─ password: Hash
├─ role: Choice (community/organization)
├─ is_approved: Boolean
├─ date_joined: DateTime
└─ updated_at: DateTime
```

### Report Model
```
Report
├─ id: Primary Key
├─ user_id: FK → User (community users only)
├─ location: String (GPS location)
├─ description: Text
├─ photo: URL (Cloudinary)
├─ date_submitted: DateTime
├─ coordinates: GeoPoint (lat, long)
└─ created_at: DateTime

Relationships:
└─ One-to-Many: User → Report
└─ One-to-One: Report → Analysis
```

### Analysis Model
```
Analysis
├─ id: Primary Key
├─ report_id: FK → Report
├─ status: Choice (pending/completed/failed)
├─ health_score: Integer (0-100)
├─ damage_detected: Boolean
├─ risk_level: Choice (low/medium/high)
├─ result: Text (AI findings)
├─ processed_at: DateTime
└─ updated_at: DateTime

Relationships:
└─ One-to-One: Report → Analysis
```

### RestorationProject Model
```
RestorationProject
├─ id: Primary Key
├─ created_by_id: FK → User (organization only)
├─ name: String
├─ description: Text
├─ location: String
├─ coordinates: GeoPoint
├─ status: Choice (planned/ongoing/completed)
├─ start_date: DateTime
├─ end_date: DateTime
├─ target_trees: Integer
├─ trees_planted: Integer
└─ created_at: DateTime

Relationships:
├─ Many-to-One: RestorationProject → User
└─ One-to-Many: RestorationProject → RestorationEvent
```

### RestorationEvent Model
```
RestorationEvent
├─ id: Primary Key
├─ project_id: FK → RestorationProject
├─ trees_planted: Integer
├─ event_date: DateTime
├─ description: Text
└─ created_at: DateTime

Relationships:
└─ Many-to-One: RestorationEvent → RestorationProject
```

### Entity Relationship Diagram
```
    ┌──────────┐
    │  User    │
    │(roles)   │
    └─────┬────┘
          │
    ┌─────┴─────────────┬─────────────┐
    │                   │             │
    ▼                   ▼             ▼
┌────────┐        ┌─────────┐    ┌──────────────┐
│Report  │◄───────│Analysis │    │Restoration   │
│        │        │         │    │Project       │
└────────┘        └─────────┘    └──────────────┘
                                       │
                                       ▼
                                 ┌──────────────┐
                                 │Restoration   │
                                 │Event         │
                                 └──────────────┘
```

---

## API Endpoints

### Authentication
```
POST /api/token/                    - Login (JWT)
POST /api/users/register/           - Register new user
POST /api/token/refresh/            - Refresh token
```

### Reports
```
GET    /api/reports/                - List reports (filtered by role)
POST   /api/reports/                - Create report (community only)
GET    /api/reports/{id}/           - Get report details
PUT    /api/reports/{id}/           - Update report
DELETE /api/reports/{id}/           - Delete report
GET    /api/reports/export/         - Export reports (org only)
```

### Analysis
```
GET    /api/analysis/               - List analyses
POST   /api/analysis/               - Create analysis (async)
GET    /api/analysis/{id}/          - Get analysis results
POST   /api/analysis/{id}/retry/    - Retry analysis
```

### Restoration Projects
```
GET    /api/projects/               - List projects
POST   /api/projects/               - Create project (org only)
GET    /api/projects/{id}/          - Get project details
PUT    /api/projects/{id}/          - Update project
DELETE /api/projects/{id}/          - Delete project
GET    /api/projects/completed-public/ - Public project stats

Events:
GET    /api/events/                 - List events
POST   /api/events/                 - Add event
```

### Users
```
GET    /api/users/                  - List users (public stats)
GET    /api/users/profile/          - Current user profile
PUT    /api/users/profile/          - Update profile
```

### Rate Limiting Headers
```
Response Headers:
├─ X-RateLimit-Limit: Maximum requests
├─ X-RateLimit-Remaining: Requests left
├─ X-RateLimit-Reset: Reset timestamp
└─ Retry-After: Seconds to wait (on 429)
```

---

## Authentication Flow

### Login Flow
```
┌─────────┐                                    ┌─────────┐
│Frontend │                                    │Backend  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /api/token/                           │
     │  { username, password }                     │
     ├─────────────────────────────────────────────►│
     │                                              │ Validate
     │                                              │ credentials
     │                                              │
     │◄─────────────────────────────────────────────┤
     │  { access_token, refresh_token }            │
     │                                              │
  Store in localStorage                            │
     │                                              │
     │  Authorization: Bearer {access_token}       │
     ├─────────────────────────────────────────────►│
     │  (All subsequent requests)                  │
     │                                              │
```

### Token Refresh Flow
```
1. Frontend receives 401 response
2. Automatically calls: POST /api/token/refresh/
3. Gets new access token
4. Retries original request
5. User unaware of token refresh
```

### Role-Based Access
```
Community User:
├─ Can submit reports
├─ Can view own reports
├─ Can see public projects
└─ Cannot access admin

Organization User:
├─ Can view all reports
├─ Can manage projects
├─ Can add events
├─ Can export reports
└─ Can access admin (if approved)
```

---

## Data Flow

### Report Submission Flow
```
1. User uploads photo + metadata
   ├─ Frontend validates form
   ├─ Photo uploaded to Cloudinary
   └─ Creates Report in database

2. Analysis triggered (Celery task)
   ├─ Download photo
   ├─ Run AI model inference
   ├─ Calculate health score
   ├─ Detect damage
   └─ Store results

3. Results cached
   ├─ Redis stores analysis
   ├─ Cache TTL: 5 minutes
   └─ Subsequent requests hit cache

4. Frontend updates
   ├─ Polls for analysis status
   ├─ Displays results when ready
   └─ Shows AI insights
```

### Real-Time Sync Flow
```
Frontend → API Request
    ↓
Rate Limit Check (Redis)
    ↓
Authentication (JWT)
    ↓
Authorization (Role check)
    ↓
Business Logic
    ↓
Database Query
    ↓
Cache Check
    ↓
Response Returned
    ↓
Frontend Update
```

### Error Handling Flow
```
API Response
    ├─ 200: Success
    ├─ 400: Bad Request (validation)
    ├─ 401: Unauthorized (invalid token)
    ├─ 403: Forbidden (no permission)
    ├─ 429: Rate Limited (too many requests)
    ├─ 500: Server Error
    └─ Retry-After header (for 429)

Frontend handling:
    ├─ Display error message (15 seconds)
    ├─ Progress bar showing retry countdown
    ├─ Auto-dismiss after timeout
    └─ User can manually dismiss
```

---

## File Structure

### Frontend Structure
```
Frontend/
├── src/
│   ├── pages/
│   │   ├── public/
│   │   │   └── LandingPage.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── reports/
│   │   │   └── ReportForm.tsx
│   │   └── restoration/
│   │       └── index.tsx
│   │
│   ├── components/
│   │   ├── ReportMap.tsx
│   │   ├── RateLimitNotification.tsx
│   │   ├── StatCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── [other UI components]
│   │
│   ├── api/
│   │   ├── axios.ts
│   │   └── auth.ts
│   │
│   ├── services/
│   │   └── auth.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useDashboard.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── App.css
│   └── index.css
│
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

### Backend Structure
```
Backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   └── celery.py
│
├── analysis/
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── tasks.py
│   ├── urls.py
│   ├── admin.py
│   └── apps.py
│
├── reports/
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   └── apps.py
│
├── restoration/
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   └── apps.py
│
├── users/
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   └── apps.py
│
├── core/
│   ├── throttles.py
│   └── __init__.py
│
├── manage.py
├── requirements.txt
├── Dockerfile
└── db.sqlite3
```

---

## Deployment Architecture

### Development (docker-compose.yml)
```
       Vite Dev Server (5173)
              │
              ▼
       React Hot Reload
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
Gunicorn (8000)     Celery Workers
    │                    │
    ├─────────┬──────────┤
    │         │          │
    ▼         ▼          ▼
 PostgreSQL  Redis   Celery Beat
```

### Production (docker-compose.prod.yml)
```
    Nginx Load Balancer (80/443)
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
   Backend (multiple instances)
   Gunicorn Workers (8000+)
           │
    ┌──────┼──────┬──────┐
    │      │      │      │
    ▼      ▼      ▼      ▼
  PostgreSQL  Redis  Celery  Beat
```

---

## Security Architecture

### Authentication & Authorization
```
Request → Rate Limit Check (Redis)
            ↓
        JWT Validation
            ↓
        Role Check
            ↓
        Permission Check
            ↓
        Execute Handler
```

### Rate Limiting Strategy
```
Layer: Redis-backed (distributed)

Endpoints:
├─ Authentication (5/min)
│  ├─ POST /api/token/
│  └─ POST /api/users/register/
│
├─ Analysis (20/day)
│  └─ POST /api/analysis/
│
└─ General (100/hour)
   ├─ GET /api/reports/
   ├─ POST /api/reports/
   ├─ GET /api/projects/
   └─ All other endpoints
```

### Data Protection
```
├─ Passwords: Django bcrypt
├─ Tokens: JWT with 15min expiry
├─ API calls: HTTPS/TLS (production)
├─ CORS: Whitelist frontend domains
├─ Cloudinary: Signed URLs
└─ Database: Encrypted at rest (optional)
```

---

## Scalability Considerations

### Horizontal Scaling
```
1. Multiple Gunicorn workers
   └─ 4 workers per container (configurable)

2. Redis Cluster
   └─ For rate limiting distribution

3. Celery Pool
   └─ Multiple worker processes

4. Load Balancer (Nginx)
   └─ Distribute across backend replicas

5. CDN (Cloudinary)
   └─ Global image distribution
```

### Performance Optimization
```
1. Caching
   ├─ Query results (Redis)
   ├─ Analysis results (5min TTL)
   └─ User data (session cache)

2. Database
   ├─ Connection pooling
   ├─ Query optimization
   └─ Indexed columns

3. Frontend
   ├─ Code splitting (React)
   ├─ Lazy loading
   ├─ Minification (Vite)
   └─ CDN (Cloudinary)

4. API
   ├─ Pagination (100 items/page)
   ├─ Filtering
   ├─ Throttling
   └─ Response compression
```

---

## Monitoring & Logging

### Backend Logging
```
├─ Django logs
├─ Celery task logs
├─ Error logs
└─ JSON formatted (production)
```

### Frontend Monitoring
```
├─ Console errors
├─ API errors
├─ Rate limit errors
└─ User interactions
```

### Health Checks
```
Backend:        /health/
Database:       pg_isready
Redis:          redis-cli ping
Celery:         celery inspect active
```

---

## Technology Decisions & Rationale

| Component | Choice | Reason |
|-----------|--------|--------|
| **Frontend** | React + TypeScript | Type safety, component reusability |
| **Backend** | Django + DRF | Rapid development, built-in features |
| **Database** | PostgreSQL | ACID compliance, reliability |
| **Cache** | Redis | High performance, distributed support |
| **Queue** | Celery | Async task processing, reliability |
| **File Storage** | Cloudinary | CDN, image optimization, scaling |
| **Rate Limiting** | Redis-backed | Distributed, efficient |
| **Containerization** | Docker | Consistency, deployment, scaling |
| **Authentication** | JWT | Stateless, scalable, modern |

---

## Summary

The Mangrove Guardian AI architecture is designed to be:

✅ **Scalable** - Horizontal scaling ready  
✅ **Reliable** - Error handling, retries, persistence  
✅ **Secure** - JWT, rate limiting, role-based access  
✅ **Maintainable** - Clean separation of concerns  
✅ **Performant** - Caching, async processing, optimization  
✅ **Modern** - TypeScript, REST API, containerized  
✅ **Production-Ready** - Docker, monitoring, logging  

---

**Last Updated:** April 17, 2026
