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
* **Package Manager:** pnpm

---

## Prerequisites

* Node.js v18+
* pnpm v8+
* PostgreSQL running locally or via a remote connection
* A PostgreSQL database created for this project

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install

```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env

```

Open `.env` and update the variables:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<database_name>"
JWT_SECRET="your_secret_key"
PORT=3000

```

`JWT_SECRET` is the private key the server uses to sign tokens on login and verify them on every protected request. It should be a long, random string. You can generate a secure one with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```

### 3. Run migrations and seed data

Make sure PostgreSQL is running, then apply the schema and generate the Prisma client:

```bash
pnpm prisma migrate dev --name init

```

To populate the database with initial seed data:

```bash
pnpm prisma db seed

```

> If your PostgreSQL user does not have `CREATE DATABASE` permissions, create the database manually first:
> ```bash
> psql -U <user> -c "CREATE DATABASE <database_name>;"
> 
> ```
> 
> 
> Then run `pnpm prisma migrate dev --name init`.

### 4. Start the development server

```bash
pnpm run dev

```

The server will be available at `http://localhost:3000`.

---

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm run dev` | Start server in development mode with hot reload |
| `pnpm run build` | Compile TypeScript to JavaScript |
| `pnpm start` | Start compiled production server |
| `pnpm prisma db seed` | Seed database with initial data |

---

## API Endpoints

### Auth

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT token | No |

### Spaces

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `GET` | `/api/spaces` | List active spaces (supports filters) | No |
| `GET` | `/api/spaces/:id` | Get a single space by ID | No |
| `POST` | `/api/spaces` | Create a new space | Admin |
| `PUT` | `/api/spaces/:id` | Update a space | Admin |
| `DELETE` | `/api/spaces/:id` | Deactivate a space | Admin |

### Bookings

| Method | Path | Description | Auth required |
| --- | --- | --- | --- |
| `POST` | `/api/reservations` | Create a booking | Member |
| `GET` | `/api/reservations` | List bookings | Member / Admin |
| `GET` | `/api/reservations/:id` | Get a single booking | Member / Admin |
| `PATCH` | `/api/reservations/:id/cancel` | Cancel a booking | Member / Admin |

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

The response includes a `token` field:

```json
{
  "user": { "id": 1, "name": "Jane Doe", "email": "user@example.com", "role": "member" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

```

**2. Include the token in subsequent requests:**

```http
GET /api/reservations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

```

The token must be sent in the `Authorization` header using the `Bearer` scheme. Requests to protected endpoints without a valid token will receive a `401 Unauthorized` response.

---

## GraphQL

A GraphQL endpoint is available at `/api/graphql` with an interactive GraphiQL playground.

Supports queries for spaces, individual space details with bookings, and occupancy analytics. Reads the `Authorization: Bearer <token>` header to provide authentication context to resolvers.

---

## Project Structure

```text
.
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── core/
│   │   ├── config/
│   │   │   └── env.config.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.handler.ts
│   │   │   └── rate-limiter.ts
│   │   ├── services/
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── app-error.ts
│   │       └── logger.ts
│   ├── entities/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.model.ts
│   │   │   └── auth.routes.ts
│   │   ├── memberships/
│   │   │   ├── memberships.controller.ts
│   │   │   ├── memberships.model.ts
│   │   │   └── memberships.routes.ts
│   │   ├── reservations/
│   │   │   ├── reservations.controller.ts
│   │   │   ├── reservations.model.ts
│   │   │   └── reservations.routes.ts
│   │   └── spaces/
│   │       ├── spaces.controller.ts
│   │       ├── spaces.model.ts
│   │       └── spaces.routes.ts
│   ├── graphql/
│   │   ├── resolvers/
│   │   │   ├── auth.resolver.ts
│   │   │   ├── reservations.resolver.ts
│   │   │   ├── spaces.resolver.ts
│   │   │   └── index.ts
│   │   ├── context.ts
│   │   └── schema.graphql
│   ├── lib/
│   │   └── prisma.ts
│   ├── tests/
│   └── index.ts
├── package-lock.yaml
├── package.json
└── tsconfig.json

```