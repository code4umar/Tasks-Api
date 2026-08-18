# Tasks API — Week 8 (NestJS + TypeORM + JWT)

An authenticated REST API over the Week 7 Task Manager database, built with
NestJS, protected by JWT, and covered by unit and e2e tests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Reuse the Week 7 database — no schema changes this week, `synchronize`
   stays `false`. If it's not already migrated:
   ```bash
   # from the Week 7 project
   npm run migration:run
   npm run seed
   ```

4. Start the API:
   ```bash
   npm run start:dev
   ```
   Runs on `http://localhost:3001` by default.

## Environment variables

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | PostgreSQL connection (same database as Week 7) |
| `JWT_SECRET` | Secret used to sign and verify tokens — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` |
| `PORT` | Port the API listens on (default `3001`) |
| `CORS_ORIGIN` | Allowed frontend origin, e.g. `http://localhost:3000` for the Week 5 Next.js app |

`.env` is git-ignored — never commit real credentials.

## Endpoints

| Method & Path | Auth | Behavior |
|---|---|---|
| `POST /auth/register` | — | Creates a user. Password is hashed with bcrypt and never returned. |
| `POST /auth/login` | — | Returns `{ accessToken }`. Wrong password → `401`. |
| `POST /tasks` | Required | Creates a task. `201` on success. |
| `GET /tasks` | — | Lists tasks. Supports `?status=`, `?projectId=`, `?assigneeId=`, combinable. |
| `GET /tasks/:id` | — | One task with project, assignee, and tags loaded. `404` if absent. |
| `PATCH /tasks/:id` | Required | Partial update. `404` if absent. |
| `DELETE /tasks/:id` | Required | Deletes a task. `204 No Content`. `404` if absent. |

## Authentication flow

1. **Register**: `POST /auth/register` with `{ name, email, password }`. The
   password is hashed with bcrypt before it's stored — the plaintext value
   is never persisted or returned.
2. **Login**: `POST /auth/login` with `{ email, password }`. The server
   looks up the user, compares the submitted password against the stored
   hash with `bcrypt.compare`, and — if it matches — signs a JWT containing
   `{ sub: userId, email }` with an expiry, returned as `{ accessToken }`.
3. **Using the token**: attach it to any guarded request as a header:
   ```
   Authorization: Bearer <accessToken>
   ```
4. **On the server**: `JwtAuthGuard` intercepts the request, verifies the
   token's signature and expiry, and hands the payload to `JwtStrategy`,
   which looks up the real user and attaches it to `request.user`.
   `@CurrentUser()` then reads that off the request inside the handler.
5. Any request to a guarded route without a valid token gets `401` before
   the handler runs at all.

### Example with curl

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
# -> { "accessToken": "eyJhbGc..." }

# Create a task (guarded)
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"title":"Write docs","priority":3,"projectId":1}'
```

## Tests

```bash
npm test          # unit test — TasksService.create with the repository mocked
npm run test:e2e  # e2e test — POST /auth/login, success + wrong password
```

## Architecture notes

- Controllers are thin: they parse the request and call a service. No
  controller makes a database call directly.
- `TasksService` receives `ProjectsService` and `UsersService` via
  constructor injection to resolve `projectId`/`assigneeId` into real
  entities — an id that doesn't exist becomes a `404`, not an unhandled
  foreign-key error.
- The global `AllExceptionsFilter` normalizes every error (validation
  failures, 404s, anything else) into the same response shape:
  `statusCode`, `message`, `error`, `timestamp`, `path`.
- `User.password` is declared `{ select: false }` on the entity — it's
  excluded from normal queries by default and must be explicitly requested
  (as `AuthService.login` does) to be compared during login.
