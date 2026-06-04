# Healflow

**University Assignment:** Java and Web Development  
**Project Type:** Healthcare appointment and patient management web application  
**Author:** Jose Esteban Vasquez Barboza

Healflow is a full-stack healthcare management platform built for a university assignment. The
application models a modern clinic workflow where clients can manage appointments, medicines, and
health information, while specialists can manage availability, review assigned clients, and complete
consultations. Administrators have a separate area for user and specialist management.

The current implementation is a TypeScript web application using TanStack React Start, Better Auth,
Drizzle ORM, and a SQLite-compatible libSQL/Turso database.

## Table of Contents

- [Project Purpose](#project-purpose)
- [Implemented Roles](#implemented-roles)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Database Model](#database-model)
- [Authentication and Authorization](#authentication-and-authorization)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Workflow](#database-workflow)
- [Available Scripts](#available-scripts)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Seed Data](#seed-data)
- [Project Structure](#project-structure)
- [Academic Scope](#academic-scope)

## Project Purpose

Healflow was designed to demonstrate the development of a realistic healthcare web application with
multiple user roles, protected routes, server-side business logic, database persistence, and a modern
React user interface.

The application focuses on these main goals:

- Support client registration, authentication, onboarding, and subscription flow.
- Allow clients to schedule, view, and cancel healthcare appointments.
- Allow specialists to manage availability and handle consultation workflows.
- Allow administrators to manage users and create specialist accounts.
- Store healthcare-related data such as medicines, health metrics, health scores, appointments, and
  address information.
- Demonstrate role-based access control, server functions, validation, and database repositories.

## Implemented Roles

### Client

Clients represent patients using the platform. They can access the client dashboard after signing in
and completing onboarding.

Implemented client capabilities include:

- Email/password and Google authentication.
- Subscription plan selection through Stripe.
- Dashboard overview with appointment, medicine, health score, and recent activity summaries.
- Appointment booking with available specialist time slots.
- Appointment history and upcoming appointment views.
- Appointment cancellation with optional reason.
- Medicine list and refill request interface.
- Health metrics and health score overview.
- Profile/settings area.

### Specialist

Specialists represent healthcare providers. They have a dedicated protected dashboard.

Implemented specialist capabilities include:

- Specialist overview with upcoming appointments, completed visits, assigned clients, and
  availability count.
- Appointment list with pending and confirmed visit actions.
- Accepting and cancelling appointments.
- Starting a consultation workspace for an appointment.
- Completing visits with notes.
- Adding medicines during a visit.
- Scheduling follow-up appointments.
- Searching an external medicine catalog while completing a visit.
- Managing weekly availability slots.
- Specialist settings area.

### Administrator

Administrators manage users and specialist accounts from a separate protected area.

Implemented administrator capabilities include:

- Viewing all registered users.
- Editing user information through Better Auth admin functionality.
- Validating role transitions before changing user roles.
- Soft-deleting users by anonymizing account data.
- Preventing deletion of users with active subscriptions.
- Creating specialist users with license number, specialty, and consultation duration.

## Core Features

### Landing Page

The public landing page presents Healflow as a healthcare platform and includes sections for the
hero content, statistics, client features, provider features, trust indicators, and call to action.

### Authentication and Onboarding

The authentication flow supports email/password sign-up, sign-in, Google OAuth, user data
collection, and Stripe payment selection. Users are redirected to role-specific areas based on their
current session and role.

### Appointment Scheduling

Clients can book appointments with available specialists. Availability is generated from specialist
weekly slots and filtered against already scheduled appointments so unavailable time slots cannot be
selected.

Appointment statuses currently include:

- `pending`
- `confirmed`
- `completed`
- `cancelled`
- `no-show`

### Specialist Consultation Workflow

Specialists can accept or cancel appointment requests, open a focused appointment workspace, add
visit notes, prescribe or record medicine information, and optionally schedule a follow-up visit.

### Medicine Management

Client medicine records store medicine name, dosage, frequency, start date, end date, and an
external medicine identifier. The specialist visit flow can search an external medicine API and use
that information when adding medication details.

### Health Metrics and Scores

The client dashboard includes health metric history and summary cards. Health scores are stored as
overall, cardiovascular, metabolic, lifestyle, and vital scores.

### Administration

The administrator dashboard centralizes user management and specialist creation. User deletion is
implemented as a soft delete that anonymizes personal information instead of physically deleting the
user record.

## Technology Stack

| Area              | Technology                                    |
| ----------------- | --------------------------------------------- |
| Runtime           | Bun 1.3+                                      |
| Framework         | TanStack React Start                          |
| Routing           | TanStack Router file-based routing            |
| UI                | React 19, shadcn/ui, Base UI, Tailwind CSS v4 |
| Forms             | TanStack React Form                           |
| Data fetching     | TanStack React Query                          |
| Authentication    | Better Auth                                   |
| Authorization     | Better Auth Admin plugin with custom roles    |
| Payments          | Stripe through Better Auth Stripe plugin      |
| Database          | libSQL/Turso, SQLite-compatible               |
| ORM               | Drizzle ORM and Drizzle Kit                   |
| Validation        | Zod                                           |
| Email             | Resend and React Email                        |
| External API      | Medicine catalog generated with Hey API       |
| Formatting        | oxfmt                                         |
| Linting and types | oxlint and tsgo                               |
| Testing           | Bun test runner                               |

## Application Architecture

Healflow uses TanStack React Start for full-stack routing and server functions. The application is
organized around route modules, reusable components, query definitions, server-side functions,
database repositories, and Drizzle schemas.

Important architectural decisions:

- Protected route groups are used for client, specialist, and admin dashboards.
- Server functions are used for business logic that requires database access or session validation.
- Database repositories isolate persistence operations from route components.
- Better Auth owns authentication, sessions, users, accounts, and subscription integration.
- Drizzle schemas define the application database tables and constraints.
- TanStack React Query is used for loading, caching, and invalidating server data in the UI.
- Zod schemas validate form input and server function input.

## Database Model

The database includes Better Auth tables and application-specific healthcare tables.

Main application tables include:

| Table                     | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `users`                   | Better Auth user accounts with role and onboarding fields     |
| `appointments`            | Client-specialist appointments and status tracking            |
| `clients`                 | Client profile details and primary care specialist assignment |
| `specialists_data`        | Specialist license, specialty, and consultation duration      |
| `specialist_availability` | Weekly specialist availability blocks                         |
| `client_medicines`        | Medicines assigned to clients                                 |
| `health-metrics`          | Individual health metric records                              |
| `health_score`            | Aggregated health score records                               |
| `addresses`               | User address records                                          |

The schema includes indexes, foreign keys, uniqueness checks, and basic integrity constraints such as
preventing the same user from being both client and specialist on an appointment.

## Authentication and Authorization

Authentication is configured in `src/lib/auth.ts` using Better Auth.

Supported authentication and account features:

- Email/password authentication.
- Google OAuth authentication.
- Session cookies integrated with TanStack Start.
- Admin plugin with `admin`, `client`, and `specialist` roles.
- Stripe subscription plans named `monthly` and `yearly`.
- Account deletion flow with email verification and soft-delete anonymization.

Custom authorization rules are defined in `src/lib/permissions.ts`. Appointment permissions are
split by role:

| Role         | Appointment Permissions       |
| ------------ | ----------------------------- |
| `client`     | request, read, update         |
| `specialist` | request, read, update, accept |
| `admin`      | read, update, delete          |

## Getting Started

### Prerequisites

Install the following before running the project:

- Bun 1.3 or newer
- A libSQL/Turso-compatible database URL
- Google OAuth credentials
- Stripe credentials and price IDs
- Resend API credentials
- A medicine API URL compatible with the generated client configuration

### Installation

Install dependencies:

```bash
bun install
```

Create a local `.env` file using the variables listed below.

Generate or apply the database schema as needed:

```bash
bun run db:generate
bun run db:migrate
```

Start the development server:

```bash
bun run dev
```

The development server runs on:

```text
http://localhost:3000
```

## Environment Variables

Server-side variables are validated in `src/env/server.ts`.

| Variable                  | Required | Description                                                   |
| ------------------------- | -------- | ------------------------------------------------------------- |
| `SERVER_URL`              | No       | Optional server URL override                                  |
| `DATABASE_URL`            | Yes      | libSQL/Turso database connection URL                          |
| `DATABASE_AUTH_TOKEN`     | No       | Database auth token when required by the database provider    |
| `BETTER_AUTH_SECRET`      | Yes      | Secret used by Better Auth                                    |
| `BETTER_AUTH_URL`         | Yes      | Public auth base URL, usually `http://localhost:3000` locally |
| `GOOGLE_CLIENT_ID`        | Yes      | Google OAuth client ID                                        |
| `GOOGLE_CLIENT_SECRET`    | Yes      | Google OAuth client secret                                    |
| `RESEND_API_KEY`          | Yes      | Resend API key for transactional email                        |
| `RESEND_EMAIL_FROM`       | Yes      | Sender email address for Resend                               |
| `STRIPE_SECRET_KEY`       | Yes      | Stripe secret key                                             |
| `STRIPE_WEBHOOK_SECRET`   | Yes      | Stripe webhook signing secret                                 |
| `STRIPE_MONTHLY_PRICE_ID` | Yes      | Stripe price ID for the monthly plan                          |
| `STRIPE_YEARLY_PRICE_ID`  | Yes      | Stripe price ID for the yearly plan                           |
| `SESSION_SECRET`          | Yes      | Application session secret with at least 32 characters        |
| `NODE_ENV`                | Yes      | `development` or `production`                                 |
| `MEDICINES_API_URL`       | Yes      | OpenAPI source URL for the medicine API client                |

Client-side variables are validated in `src/env/client.ts`.

| Variable                  | Required | Description                                |
| ------------------------- | -------- | ------------------------------------------ |
| `VITE_APP_TITLE`          | No       | Optional application title                 |
| `VITE_R2_PUBLIC_BASE_URL` | No       | Optional public base URL for stored assets |

## Database Workflow

Generate Drizzle migrations from the schema:

```bash
bun run db:generate
```

Apply pending migrations:

```bash
bun run db:migrate
```

Push schema changes directly to the development database:

```bash
bun run db:push
```

Regenerate Better Auth database schema output:

```bash
bun run auth:generate
```

## Available Scripts

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `bun run dev`            | Start the development server on port 3000       |
| `bun run build`          | Build the production application                |
| `bun run preview`        | Preview the production build                    |
| `bun run start`          | Start the built Nitro server                    |
| `bun run test`           | Run the Bun test suite                          |
| `bun run validate`       | Run TypeScript checks (tsgo) and oxlint         |
| `bun run lint`           | Run oxlint                                      |
| `bun run lint:fix`       | Run oxlint with automatic fixes                 |
| `bun run fmt`            | Format the project with oxfmt                   |
| `bun run fmt:check`      | Check formatting without writing changes        |
| `bun run check`          | Run oxfmt and oxlint fix workflow               |
| `bun run db:generate`    | Generate Drizzle migration files                |
| `bun run db:migrate`     | Apply database migrations                       |
| `bun run db:push`        | Push schema directly to the database            |
| `bun run db:seed`        | Seed development data                           |
| `bun run auth:generate`  | Regenerate Better Auth schema                   |
| `bun run cn:add`         | Add shadcn/ui components                        |
| `bun run stripe:webhook` | Forward local Stripe webhooks to the auth route |

## Testing and Quality Checks

The project uses Bun's test runner. Tests are located in `tests/` and cover repository logic,
server-side functions, auth helpers, permissions, settings, appointments, medicines, health metrics,
and related utilities.

Run all tests:

```bash
bun run test
```

Run type checks and linting:

```bash
bun run validate
```

Check formatting:

```bash
bun run fmt:check
```

Run the main project quality workflow:

```bash
bun run check
```

## Seed Data

The project includes a seeding script at `src/db/seed.ts`.

Default seed command:

```bash
bun run db:seed
```

By default, the seed script creates:

- An administrator user.
- A collection of specialist users with availability.
- A basic test specialist account.

Useful seeded accounts include:

| Role       | Email               | Password |
| ---------- | ------------------- | -------- |
| Admin      | `admin@admin.admin` | `admin`  |
| Specialist | `spe@test.com`      | `spe`    |

The seed script also supports targeted seeders such as `medical-info`, `specialists`, `admin`, and
`basic-specialist`.

Example:

```bash
bun run src/db/seed.ts specialists
```

## Project Structure

```text
src/
  client/              Generated medicine API client
  components/          Shared UI and application components
  db/                  Drizzle setup, schemas, repositories, migrations, and seed logic
  env/                 Environment validation
  hooks/               Form helpers
  lib/                 Auth, server functions, utilities, and result serialization
  queries/             TanStack React Query option factories
  routes/              TanStack Router file-based routes
  schemas/             Zod schemas for forms and server input
  types/               Shared TypeScript domain types
tests/                 Bun tests mirroring the source layout
```

Generated or framework-managed files include:

- `src/routeTree.gen.ts`, generated by TanStack Router.
- `src/db/schemas/auth.ts`, generated by Better Auth.
- `src/db/schemas/index.ts`, generated by the Vite auto-barrel plugin.
