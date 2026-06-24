# JotDown Backend Migration: Laravel → Spring Boot

> **Mode:** PLANNING ONLY — NO CODE  
> **Created:** 2026-06-23  
> **Project Type:** BACKEND (API migration)

# Mandatory Pre-Task Execution Protocol (P0)

Before starting any implementation or refactoring task, the agent **MUST** perform the following steps:
1. **Read `migration-context.md`**: Retrieve the latest domain requirements, business rules (such as protected notes masking, self-share prevention, and per-user label pivots), and constraints.
2. **Utilize `gitnexus` Tools**: Query the gitnexus MCP server to analyze repository structures, trace execution paths, and fully grasp the existing Laravel legacy patterns and database schemas before writing any code.

---

## Overview

Migrate JotDown's backend from PHP Laravel to Java Spring Boot **incrementally by feature module**. The goal is NOT line-by-line translation — it's to preserve business logic while redesigning with Spring Boot best practices.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **WebSocket** | Keep Pusher | Frontend unchanged, Spring Boot pushes events via Pusher REST API |
| **Database** | Keep existing MySQL schema | No schema redesign — JPA entities map to current tables (including SP/triggers) |
| **Auth** | Spring Security + JWT | Stateless, replaces Sanctum tokens |
| **Migration Tool** | Flyway | Validate existing schema, no destructive migrations |
| **Build Tool** | Maven | As defined in Project.md |

---

## Success Criteria

- [ ] All existing API endpoints return identical response shapes (frontend zero-change)
- [ ] All 16 existing DB migrations are compatible (Flyway baseline)
- [ ] JWT auth works with same login/register flow
- [ ] Pusher events broadcast with same channel names and event payloads
- [ ] Offline sync push/pull produces identical results
- [ ] Docker Compose updated to run Spring Boot + MySQL
- [ ] Existing stored procedures, triggers, and functions remain untouched

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Security | Spring Security 6 + jjwt (JWT) |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL 8.0 (existing schema) |
| Migration | Flyway (baseline mode) |
| Mail | Spring Boot Starter Mail + Resend (SMTP) |
| WebSocket Push | Pusher Java Server SDK |
| File Upload | Cloudinary (HTTP client, signed upload) |
| Validation | Jakarta Bean Validation |
| Build | Maven |
| Container | Docker |
| Scheduled Tasks | `@Scheduled` (Spring) |

---

## Target File Structure

```
backend-spring/
├── pom.xml
├── Dockerfile
├── src/main/
│   ├── java/com/jotdown/api/
│   │   ├── JotDownApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   ├── CorsConfig.java
│   │   │   ├── JwtConfig.java
│   │   │   ├── PusherConfig.java
│   │   │   └── CloudinaryConfig.java
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── CustomUserDetailsService.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── NoteController.java
│   │   │   ├── LabelController.java
│   │   │   ├── NoteShareController.java
│   │   │   ├── NoteAttachmentController.java
│   │   │   ├── SyncController.java
│   │   │   └── HealthController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── NoteService.java
│   │   │   ├── LabelService.java
│   │   │   ├── NoteShareService.java
│   │   │   ├── AttachmentService.java
│   │   │   ├── SyncService.java
│   │   │   ├── PusherService.java
│   │   │   ├── MailService.java
│   │   │   ├── OtpService.java
│   │   │   └── CloudinaryService.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── NoteRepository.java
│   │   │   ├── LabelRepository.java
│   │   │   ├── NoteLabelRepository.java
│   │   │   ├── NoteShareRepository.java
│   │   │   ├── NoteAttachmentRepository.java
│   │   │   └── SyncQueueRepository.java
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Note.java
│   │   │   ├── Label.java
│   │   │   ├── NoteLabel.java
│   │   │   ├── NoteShare.java
│   │   │   ├── NoteAttachment.java
│   │   │   └── SyncQueue.java
│   │   ├── dto/
│   │   │   ├── request/   (LoginRequest, RegisterRequest, etc.)
│   │   │   └── response/  (ApiResponse, NoteResponse, etc.)
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── custom exceptions...
│   │   └── scheduler/
│   │       └── CleanupScheduler.java
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       ├── application-prod.yml
│       └── db/migration/
│           └── V1__baseline.sql (Flyway baseline marker)
└── src/test/java/...
```

---

## Migration Context
> **Must do:** Follow file migration-context.md to understand business logic of function and project.

## Migration Phases

> **Strategy:** Each phase produces a **working, testable module**. Phases are ordered by dependency — later phases depend on earlier ones. Frontend stays on Laravel until all phases pass, then switch over.

---

### PHASE 1: Foundation + Authentication (Completed)

**Goal:** Spring Boot project setup + JWT auth that produces identical API responses to Sanctum.

#### Task 1.1 — Project Scaffold (Completed)
- **Agent:** `backend-specialist`
- **Skills:** `clean-code`
- **Priority:** P0 (Foundation)
- **Dependencies:** None
- **INPUT:** Tech stack decisions from this plan
- **OUTPUT:** Maven project with Spring Boot 3.x, Java 21, all dependencies in `pom.xml`
- **VERIFY:** `mvn clean compile` succeeds

#### Task 1.2 — JPA Entity Mapping (Completed)
- **Agent:** `backend-specialist`
- **Skills:** `database-design`
- **Priority:** P0
- **Dependencies:** 1.1
- **INPUT:** Existing MySQL schema (16 migrations), 6 Laravel models
- **OUTPUT:** 7 JPA entities (`User`, `Note`, `Label`, `NoteLabel`, `NoteShare`, `NoteAttachment`, `SyncQueue`) with correct column mappings, relationships, soft-delete support
- **VERIFY:** Application starts without Hibernate schema validation errors against existing MySQL DB

#### Task 1.3 — Flyway Baseline (Completed)
- **Agent:** `backend-specialist`
- **Skills:** `database-design`
- **Priority:** P0
- **Dependencies:** 1.2
- **INPUT:** Existing MySQL database with data
- **OUTPUT:** Flyway configured in `baseline` mode — validates schema without running destructive migrations
- **VERIFY:** `flyway:info` shows baseline applied, `flyway:validate` passes

#### Task 1.4 — Spring Security + JWT (Completed)
- **Agent:** `backend-specialist` + `security-auditor`
- **Skills:** `api-patterns`, `vulnerability-scanner`
- **Priority:** P0
- **Dependencies:** 1.2
- **INPUT:** Laravel Sanctum token flow, `AuthController.php` login/logout/register
- **OUTPUT:** 
  - `JwtTokenProvider` (generate/validate tokens)
  - `JwtAuthenticationFilter` (extract token from Bearer header)
  - `SecurityConfig` (public vs protected routes matching Laravel's route groups)
  - `CustomUserDetailsService` (load user by email)
- **VERIFY:** 
  - POST `/api/v1/auth/login` returns JWT token in same response shape
  - Protected routes return 401 without token
  - Token validation works

#### Task 1.5 — Auth Endpoints (Full) (Completed)
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`, `clean-code`
- **Priority:** P0
- **Dependencies:** 1.4
- **INPUT:** `AuthController.php` (503 lines) — all 14 auth endpoints
- **OUTPUT:** Spring Boot `AuthController.java` + `AuthService.java` + `OtpService.java` with all 14 endpoints
- **VERIFY:** All 14 endpoints return identical JSON response shapes

#### Task 1.6 — CORS + Global Error Handling (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P0
- **Dependencies:** 1.1
- **INPUT:** Laravel `cors.php` config, error response patterns
- **OUTPUT:** `CorsConfig.java`, `GlobalExceptionHandler.java`
- **VERIFY:** Frontend at `localhost:5173` can call API without CORS errors

#### Task 1.7 — Docker Setup (Completed)
- **Agent:** `devops-engineer`
- **Skills:** `deployment-procedures`
- **Priority:** P0
- **Dependencies:** 1.1
- **INPUT:** Existing `docker-compose.yml`
- **OUTPUT:** New `backend-spring/Dockerfile`, updated `docker-compose.yml`
- **VERIFY:** `docker-compose up backend-spring db` — app starts and connects to MySQL

---

### PHASE 2: Notes CRUD (Completed)

**Goal:** Full Note management with version conflict detection and protected notes.

#### Task 2.1 — NoteRepository + NoteService (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Phase 1
- **INPUT:** `NoteController.php` (250 lines), `NotePolicy.php`, `CloudinaryAttachmentService.php`
- **OUTPUT:** `NoteRepository.java` + `NoteService.java` (mask protected, version conflict, cascade soft-delete)
- **VERIFY:** Unit tests for service layer

#### Task 2.2 — NoteController REST Endpoints (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** 2.1
- **INPUT:** Laravel routes: `GET/POST/PUT/DELETE /api/v1/notes`, `POST /verify-password`
- **OUTPUT:** 6 endpoints matching Laravel response shapes
- **VERIFY:** Protected note masking works (blur URLs, fake content). 409 on version conflict.

#### Task 2.3 — Authorization (NotePolicy equivalent) (Completed)
- **Agent:** `backend-specialist` + `security-auditor`
- **Priority:** P1
- **Dependencies:** 2.1
- **INPUT:** `NotePolicy.php` — view, update, delete, share, manageShare
- **OUTPUT:** Authorization logic in service layer
- **VERIFY:** Owner=full, EDIT-shared=update only, READ-shared=view only, others=403

---

### PHASE 3: Labels (Completed)

#### Task 3.1 — LabelController + LabelService (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Phase 1
- **INPUT:** `LabelController.php` (80 lines)
- **OUTPUT:** `LabelRepository`, `LabelService`, `LabelController` — CRUD
- **VERIFY:** CRUD works, user ownership enforced

#### Task 3.2 — Label Attach/Detach on Notes (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** 3.1 + Phase 2
- **INPUT:** `attachLabels()`, `detachLabels()`, `note_labels` pivot with `user_id`
- **OUTPUT:** Attach/detach endpoints handling per-user pivot correctly
- **VERIFY:** Shared note shows only current user's labels

---

### PHASE 4: Note Sharing (Completed)

#### Task 4.1 — NoteShareService + NoteShareController (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Phase 2
- **INPUT:** `NoteShareController.php` (169 lines)
- **OUTPUT:** Share/revoke/update-permission/shared-with-me — 4 endpoints
- **VERIFY:** Self-share=422, response matches `NoteShareResource` shape

---

### PHASE 5: Attachments (Cloudinary) (Completed)

#### Task 5.1 — CloudinaryService (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Phase 1
- **INPUT:** `CloudinaryAttachmentService.php` (117 lines)
- **OUTPUT:** `CloudinaryService.java` — signature, validation, blur URL
- **VERIFY:** Signature matches Cloudinary expected format

#### Task 5.2 — NoteAttachmentController (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** 5.1 + Phase 2
- **INPUT:** `NoteAttachmentController.php`, `AttachmentSignatureController.php`
- **OUTPUT:** 4 attachment endpoints
- **VERIFY:** Upload → save → delete flow works

---

### PHASE 6: Offline Sync (Completed)

#### Task 6.1 — SyncService + SyncController (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Phase 2, 3, 5
- **INPUT:** `SyncController.php` (420 lines) — most complex controller
- **OUTPUT:** Push (5 action types) + Pull (delta since timestamp)
- **VERIFY:** Push returns `{ success_count, failed_count, conflicts }`. Pull returns `{ notes, deleted_ids, synced_at }`.

---

### PHASE 7: Realtime (Pusher) (Completed)

#### Task 7.1 — PusherService (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P2
- **Dependencies:** Phase 1
- **INPUT:** 4 Laravel Events, `channels.php`, Pusher config
- **OUTPUT:** `PusherService.java` — broadcast methods matching exact channel names + event payloads
- **VERIFY:** Frontend receives events without code changes

#### Task 7.2 — Broadcasting Auth Endpoint (Completed)
- **Dependencies:** 7.1
- **OUTPUT:** `POST /api/broadcasting/auth` — Pusher channel auth with JWT context
- **VERIFY:** Frontend can subscribe to private channels

#### Task 7.3 — Wire Events into Controllers (Completed)
- **Dependencies:** 7.1 + Phases 2, 4
- **OUTPUT:** All controllers call `PusherService` at same trigger points as Laravel
- **VERIFY:** Edit note → other user sees update. Share → receiver notified.

---

### PHASE 8: Mail + Scheduled Tasks (Completed)

#### Task 8.1 — MailService (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P2
- **Dependencies:** Phase 1
- **INPUT:** 3 Laravel Mailables
- **OUTPUT:** `MailService.java` + email templates via Resend SMTP
- **VERIFY:** OTP email, verify email link, share notification all arrive

#### Task 8.2 — Scheduled Tasks (Completed)
- **Priority:** P3
- **Dependencies:** Phase 5
- **INPUT:** `console.php` — cleanup commands
- **OUTPUT:** `CleanupScheduler.java` with `@Scheduled`
- **VERIFY:** Orphan detection + deletion works

---

## Phase Dependency Graph

```
Phase 1 (Foundation + Auth) ──┬── Phase 2 (Notes) ──┬── Phase 4 (Sharing)
                               │                      ├── Phase 6 (Sync)
                               │                      └── Phase 5 (Attachments)
                               ├── Phase 3 (Labels) ──┘
                               ├── Phase 7 (Realtime/Pusher)
                               └── Phase 8 (Mail + Cron)
                                        │
                               All Phases Passed ──── Phase 9 (Deployment)
```

---

## Full API Endpoint Map (33 endpoints)

### Public Routes
| Method | Endpoint | Source |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| GET | `/api/ping` | DB connectivity |
| POST | `/api/v1/auth/register` | AuthController |
| POST | `/api/v1/auth/login` | AuthController |
| POST | `/api/v1/auth/verify-otp` | AuthController |
| POST | `/api/v1/auth/forgot-password` | AuthController |
| POST | `/api/v1/auth/reset-password` | AuthController |
| POST | `/api/v1/auth/resend-otp` | AuthController |
| GET | `/api/v1/auth/verify-email/{id}/{hash}` | AuthController |

### Protected Routes (JWT)
| Method | Endpoint | Source |
|--------|----------|-------|
| POST | `/api/v1/auth/logout` | AuthController |
| POST | `/api/v1/auth/change-password` | AuthController |
| POST | `/api/v1/auth/send-verify-otp` | AuthController |
| POST | `/api/v1/auth/send-verification-link` | AuthController |
| GET | `/api/v1/auth/user` | AuthController |
| PUT | `/api/v1/auth/update-profile` | AuthController |
| POST | `/api/v1/auth/upload-avatar` | AuthController |
| PUT | `/api/v1/auth/update-preferences` | AuthController |
| GET/POST/PUT/DELETE | `/api/v1/notes[/{id}]` | NoteController |
| POST | `/api/v1/notes/{id}/verify-password` | NoteController |
| POST | `/api/v1/notes/{id}/labels/attach` | NoteController |
| POST | `/api/v1/notes/{id}/labels/detach` | NoteController |
| GET/POST/PUT/DELETE | `/api/v1/labels[/{id}]` | LabelController |
| GET | `/api/v1/notes/shared-with-me` | NoteShareController |
| POST | `/api/v1/notes/{id}/share` | NoteShareController |
| PUT | `/api/v1/notes/{id}/shares/{shareId}` | NoteShareController |
| DELETE | `/api/v1/notes/{id}/shares/{shareId}` | NoteShareController |
| POST | `/api/v1/attachments/signature` | AttachmentSignature |
| POST | `/api/v1/notes/{id}/attachments/signature` | NoteAttachment |
| POST | `/api/v1/notes/{id}/attachments` | NoteAttachment |
| DELETE | `/api/v1/notes/{id}/attachments/{attId}` | NoteAttachment |
| POST | `/api/v1/sync/push` | SyncController |
| GET | `/api/v1/sync/pull` | SyncController |
| POST | `/api/broadcasting/auth` | Pusher auth |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| JWT format differs from Sanctum → frontend breaks | HIGH | Match `Authorization: Bearer {token}` pattern |
| Hibernate auto-DDL conflicts with schema | HIGH | `ddl-auto=validate` only |
| Pusher event payload mismatch | MEDIUM | Integration tests comparing payloads |
| Soft-delete handling differs | MEDIUM | `@SQLDelete` + `@Where` annotations |
| `note_labels` pivot with `user_id` | MEDIUM | Separate `NoteLabel` entity, not `@ManyToMany` |
| BCrypt rounds mismatch | LOW | Verify rounds=12 matches |

---

### PHASE 9: Deployment (Render.com) (Completed)

Goal: Deploy Spring Boot service to production on Render.com, replacing the Laravel Docker service. Zero-downtime cutover.

> **Pre-condition:** All Phases 1–8 complete and verified locally.

#### Task 9.1 — Production Dockerfile (Completed)
- **Agent:** `devops-engineer`
- **Skills:** `deployment-procedures`
- **Priority:** P3
- **Dependencies:** All previous phases
- **INPUT:** Existing `backend/Dockerfile` (Apache/PHP), Java 21 Maven project
- **OUTPUT:** `backend-spring/Dockerfile` using multi-stage build:
  - **Stage 1 (build):** `maven:3.9-eclipse-temurin-21` — `mvn clean package -DskipTests`
  - **Stage 2 (runtime):** `eclipse-temurin:21-jre-alpine` — copy jar, expose port 8080
- **VERIFY:** `docker build -t jotdown-spring .` succeeds. `docker run` starts app on port 8080.

#### Task 9.2 — Health Check Endpoint (Completed)
- **Agent:** `backend-specialist`
- **Priority:** P3
- **Dependencies:** 9.1
- **INPUT:** Render requires `healthCheckPath` — currently `/up` in `render.yaml`
- **OUTPUT:** `HealthController.java`:
  - `GET /up` — Render health check (returns 200 OK)
  - `GET /api/health` — existing health check (returns `{ status: ok }`)
  - `GET /api/ping` — DB connectivity check
- **VERIFY:** Render health check passes on deploy

#### Task 9.3 — Environment Variables (`application-prod.yml`) (Completed)
- **Agent:** `devops-engineer`
- **Priority:** P3
- **Dependencies:** 9.1
- **INPUT:** Existing `render.yaml` env vars (Laravel-specific), `.env.example`
- **OUTPUT:** `application-prod.yml` mapping all env vars to Spring properties:

  | render.yaml key | Spring Boot property |
  |-----------------|---------------------|
  | `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | `spring.datasource.*` |
  | `PUSHER_APP_ID/KEY/SECRET/CLUSTER` | Custom `pusher.*` |
  | `RESEND_API_KEY`, `MAIL_FROM_ADDRESS` | `spring.mail.*` |
  | `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET/FOLDER` | Custom `cloudinary.*` |
  | `JWT_SECRET` (new — no Laravel equivalent) | Custom `jwt.secret` |
  | `FRONTEND_URL` | CORS allowed origins |

- **VERIFY:** App starts in `prod` profile with all env vars injected

#### Task 9.4 — Update `render.yaml` (Completed)
- **Agent:** `devops-engineer`
- **Priority:** P3
- **Dependencies:** 9.2, 9.3
- **INPUT:** Existing `render.yaml` pointing to `backend/Dockerfile` (Laravel)
- **OUTPUT:** Updated `render.yaml` pointing to `backend-spring/Dockerfile`:
  ```yaml
  services:
    - type: web
      name: jotdown-backend
      runtime: docker
      dockerContext: backend-spring
      dockerfilePath: backend-spring/Dockerfile
      healthCheckPath: /up
      buildFilter:
        paths:
          - backend-spring/**
          - render.yaml
      envVars:
        # Remove Laravel-specific: APP_KEY, SANCTUM_STATEFUL_DOMAINS, SESSION_DRIVER, etc.
        # Add JWT_SECRET (sync: false)
        # Keep: DB_*, PUSHER_*, MAIL_*, CLOUDINARY_*, FRONTEND_URL
  ```
- **VERIFY:** `render.yaml` diff reviewed — no sensitive values hardcoded

#### Task 9.5 — Cutover Strategy (Completed)
- **Agent:** `devops-engineer`
- **Skills:** `deployment-procedures`
- **Priority:** P3
- **Dependencies:** 9.4
- **INPUT:** Live production with active users
- **OUTPUT:** Step-by-step cutover checklist:
  1. **Shadow run:** Deploy `jotdown-backend-spring` as a *second* Render service (different name) pointing to same DB
  2. **Smoke test:** Run Postman against the shadow service — verify all 33 endpoints
  3. **Switch DNS/traffic:** Update Render routing (or nginx config) to point `jotdown-backend` to Spring Boot service
  4. **Monitor:** Watch Render logs for 15 minutes post-cutover
  5. **Rollback plan:** Keep Laravel service running in standby for 24h; one-click rollback in Render dashboard
- **VERIFY:** Zero 5xx errors in first 15 minutes post-cutover

---

## Phase X: Final Verification

### Functional
- [ ] All 33 API endpoints respond with correct JSON shapes
- [ ] JWT login/register/logout works from frontend
- [ ] Protected notes: masked content + blurred images
- [ ] Version conflict returns 409
- [ ] Label attach/detach respects per-user pivot
- [ ] Share/revoke with email notification
- [ ] Pusher events on note edit, share, revoke
- [ ] Sync push handles 5 action types
- [ ] Sync pull returns delta since timestamp
- [ ] Scheduled tasks run correctly

### Build & Infrastructure
- [ ] `mvn clean package` builds without errors
- [ ] Docker multi-stage build produces runnable image
- [ ] Docker Compose boots Spring Boot + MySQL locally
- [ ] No Hibernate schema validation errors
- [ ] Stored procedures, triggers, functions still work

### Security
- [ ] No unauth endpoints exposed
- [ ] JWT secret not hardcoded (via env var)
- [ ] CORS restricted to `FRONTEND_URL` only in prod

### Production (Render)
- [ ] `GET /up` returns 200 (Render health check passes)
- [ ] All env vars injected correctly in prod profile
- [ ] Shadow service smoke test passes (all 33 endpoints)
- [ ] Zero 5xx errors in first 15 minutes post-cutover
- [ ] Rollback plan documented and tested
