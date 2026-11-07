# SpaceHub API

REST API for managing coworking spaces, bookings, and memberships. Built with Node.js, Express, TypeScript, and PostgreSQL.

---

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **API:** REST + GraphQL
* **Package Manager:** npm
* **Docs:** OpenAPI 3 + Swagger UI
* **API tests:** Bruno

---

## Prerequisites

* Node.js v18+
* PostgreSQL running locally or via a remote connection
* A PostgreSQL database created for this project

---

## Getting Started

### 1. Install dependencies

```bash
npm install

```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env

```

Open `.env` and fill in the `DB_*` variables and a long random `JWT_SECRET`. The Prisma CLI reads `DATABASE_URL`, which `.env.example` already composes from the `DB_*` values. Nothing sensitive is committed: `.env` is git-ignored.

`JWT_SECRET` is the private key the server uses to sign tokens on login and verify them on every protected request. It should be a long, random string. You can generate a secure one with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```

### 3. Run migrations and seed data

Make sure PostgreSQL is running, then apply the migrations:

```bash
npm run db:migrate

```

To populate the database with demo data (admin `admin@spacehub.com`, members `john@example.com` / `jane@example.com`, all with password `password123`):

```bash
npm run db:seed

```

> If your PostgreSQL user does not have `CREATE DATABASE` permissions, create the database manually first:
> ```bash
> psql -U <user> -c "CREATE DATABASE <database_name>;"
> 
> ```
> 
> 
> Then run `npm run db:migrate`.

### 4. Start the development server

```bash
npm run dev

```

The server will be available at `http://localhost:3000`, with the interactive OpenAPI documentation at `http://localhost:3000/api/docs` (raw JSON at `/api/docs.json`).

---

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start server in development mode with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:migrate` | Apply pending Prisma migrations |
| `npm test` | Run the unit tests (Vitest, no database needed) |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:api` | Run the Bruno suite against a running server |
| `npm start` | Start compiled production server |
| `npx prisma db seed` | Seed database with initial data |

---

## API Endpoints

### Auth

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in and receive an access token and a refresh token | No |
| `POST` | `/api/auth/refresh` | Exchange a refresh token for a new token pair | No |

### Spaces

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `GET` | `/api/spaces` | List active spaces. Filters: `type`, `minCapacity`, `date` (YYYY-MM-DD) | No |
| `GET` | `/api/spaces/:id` | Get a single space by ID | No |
| `POST` | `/api/spaces` | Create a new space | Admin |
| `PUT` | `/api/spaces/:id` | Update a space | Admin |
| `DELETE` | `/api/spaces/:id` | Deactivate a space | Admin |

### Bookings

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `POST` | `/api/bookings` | Create a booking | Member |
| `GET` | `/api/bookings` | List bookings | Member / Admin |
| `GET` | `/api/bookings/:id` | Get a single booking | Member / Admin |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel a booking | Member / Admin |

### Memberships

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `GET` | `/api/memberships` | List all memberships | Admin |
| `PATCH` | `/api/memberships/:userId` | Update a user's membership plan | Admin |

> Requests to protected endpoints must include an `Authorization: Bearer <token>` header.

---

## Authentication

Most endpoints require a JWT token. Here's the full flow:

**1. Register or log in to get a token:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}

```

The response includes a `token` (short lived) and `refreshToken` fields. Use `POST /api/auth/refresh` with `{ "refreshToken": "..." }` to get a new pair without logging in again:

```json
{
  "user": { "id": 1, "name": "Jane Doe", "email": "user@example.com", "role": "MEMBER" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

```

**2. Include the token in subsequent requests:**

```http
GET /api/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

```

The token must be sent in the `Authorization` header using the `Bearer` scheme. Requests to protected endpoints without a valid token will receive a `401 Unauthorized` response, and admin-only endpoints answer `403 Forbidden` to members. Every error is JSON: `{ "status": "error", "message": "..." }`.

---

## GraphQL

A GraphQL endpoint is available at `/api/graphql` with an interactive GraphiQL playground. It reuses the same services as the REST API, so the rules are identical.

| Operation | Access |
| --- | --- |
| `spaces`, `space` | Public (bookings are only returned to admins) |
| `register`, `login`, `refreshToken` | Public |
| `bookings`, `booking`, `createBooking`, `cancelBooking` | Authenticated (members only see their own) |
| `memberships`, `updateMembership`, `occupancyAnalytics` | Admin |

Send the `Authorization: Bearer <token>` header. Errors carry `extensions.code` (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`). Note that `express-graphql` answers HTTP 500 when an error nulls the whole `data`, so check `errors` in the body.

---

## Unit tests (Vitest)

`tests/` mirrors `src/`: `tests/core/...`, `tests/entities/<name>/<name>.service.test.ts`, `tests/graphql/...`. Each module is tested in isolation: Prisma and the logger are mocked globally (`tests/helpers/setup.ts`), and tests that depend on another service mock it with `vi.mock`. No database or running server is required.

```bash
npm test                # run once
npm run test:watch      # watch mode
npm run test:coverage   # coverage report
```

New module `src/entities/foo/foo.service.ts` -> `tests/entities/foo/foo.service.test.ts`. Shared builders live in `tests/helpers/factories.ts`.

---

## API tests (Bruno)

The collection lives in `bruno/` and covers every endpoint with success and error cases. With the server running (and the database seeded):

```bash
NODE_ENV=Test npm run dev   # terminal 1: Test mode disables rate limiting
npm run test:api            # terminal 2
```

The target URL is `baseUrl` in `bruno/environments/local.bru` (default `http://localhost:3000`). Each run creates its own users and spaces, so it can be repeated.

---

## Code Conventions

* **Layers:** `routes` only wire middlewares and call a `service`; services hold the business rules and throw `AppError`; `schema` files hold the Zod validation and `types` files hold the TypeScript types derived from them. REST and GraphQL reuse the same services, so the rules are written once.
* **Errors:** always JSON, `{ "status": "error", "message": "..." }`, produced by the central error handler.
* **Documentation:** everything is documented in English with JSDoc (`@param`, `@returns`, `@throws`); Prisma models and fields use `///` comments. When an endpoint changes, update its route comment and `src/docs/openapi.ts`.
* **Lint and format:** `npm run lint`, `npm run format`.

---

## Project Structure

```text
.
├── bruno/                      # Bruno collection
├── prisma/                     # schema, migrations, seed
├── tests/                      # unit tests, same layout as src/
├── src/
│   ├── core/                   # config, middlewares, jwt service, utils, shared schemas
│   ├── docs/                   # OpenAPI spec + Swagger UI route
│   ├── entities/<name>/        # <name>.routes / .service / .schema (zod) / .types
│   ├── graphql/                # GraphQL schema, context and resolvers
│   ├── lib/prisma.ts
│   ├── app.ts
│   └── server.ts
└── package.json
```
