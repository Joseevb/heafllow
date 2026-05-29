# Healflow — AGENTS.md

## Stack

- **Runtime**: Bun 1.3+
- **Framework**: TanStack React Start (SSR via Nitro), React 19
- **Router**: TanStack Router (file-based); `src/routeTree.gen.ts` is auto-generated — do not edit
- **Schema gen**: Drizzle Kit → SQLite (`drizzle-orm/bun-sqlite`)
- **Auth**: Better Auth v1.6 (Drizzle adapter, SQLite, TanStack Start cookies)
- **UI**: shadcn/ui (Base UI, not Radix `asChild`), Tailwind CSS v4
- **Formatter**: oxfmt (NOT Prettier/Biome)
- **Linter**: oxlint (NOT ESLint)

## Common commands

| Command                 | Action                           |
| ----------------------- | -------------------------------- |
| `bun run dev`           | Dev server on port 3000          |
| `bun run build`         | Production build                 |
| `bun run test`          | Run all tests (4 groups)         |
| `bun run test:coverage` | Repo tests with coverage report  |
| `bun run lint`          | oxlint                           |
| `bun run fmt`           | oxfmt                            |
| `bun run check`         | oxfmt && oxlint --fix            |
| `bun run db:generate`   | Drizzle Kit schema→SQL migration |
| `bun run db:migrate`    | Apply pending migrations         |
| `bun run db:push`       | Push schema directly (dev only)  |
| `bun run auth:generate` | Regenerate Better Auth DB schema |
| `bun run cn:add`        | Add shadcn component             |

## Project structure

```
src/
  routes/           File-based TanStack Router routes
  components/ui/    shadcn components (excluded from oxlint)
  db/
    schemas/         Drizzle schemas + auto-generated auth.ts
    repository/      BaseRepository + entity repositories
  lib/
    auth.ts          Better Auth server config
    auth-client.ts   Better Auth client config
    auth.functions.ts Session/role middleware + server fns
    permissions.ts   RBAC: admin / client / specialist roles
    email.functions.ts Resend email via server fn
    result.ts        safeSerialize wrapper for TanStack Start
  env/               @t3-oss/env-core validation (server.ts + client.ts)
  hooks/             TanStack React Form (form.ts)
tests/               Mirrors src layout
```

## Code conventions

- **No semicolons**, single quotes, trailing commas, 100-char print width
- **Path alias**: `@/` → `./src/*`
- **Type imports**: `import type { X }` (enforced by oxlint)
- **Array types**: generic style `Array<T>` (enforced by oxlint)
- **Functions**: `export function foo() {}` not `const foo = () => {}`
- **Tailwind classes**: sorted by oxfmt (configured in `.oxfmtrc.json`)

## Auth & server functions

- Server fns use `createServerFn` from `@tanstack/react-start`
- Protect with `ensureSessionMiddleware` or `createRoleMiddleware(role)`
- Results use `better-result` `Result` type; serialize via `safeSerialize()` (strips methods for wire safety)
- Auth API route: `src/routes/api/auth.$.ts` proxies all `/api/auth/*` to `auth.handler(request)`

## Architecture notes

- `src/db/schemas/index.ts` is **auto-generated** on dev server start by the `autoBarrel` Vite plugin — do not edit manually
- Do NOT use Radix `asChild` pattern — this project uses Base UI components
- DB: SQLite via `drizzle-orm/bun-sqlite`; `DB_FILE_NAME` env var (can be `:memory:` for tests)
- Stripe: Better Auth Stripe plugin, subscription plans `monthly`/`yearly`
- Roles: `client` (default), `specialist`, `admin`; custom `appointment` permission statements
- Soft delete: user data is anonymized in-place (name→"Deleted User", email→`deleted_{id}@deleted.invalid`)

## Testing

- **Runner**: `bun test` (Bun test runner, not Vitest)
- **Timeout**: 10s (configured in `bunfig.toml`)
- **Coverage**: Disabled by default (use `bun run test:coverage` for repo tests); coverage is disabled in `bunfig.toml` because Bun's `coverageThreshold` is per-file and schema/utility files inherently have low function coverage. CI uses `test:coverage` targeting only the repo group (90.96% line coverage).
- **Test env**: `src/test/setup.ts` preload sets env vars; DB uses `:memory:` SQLite
- DB repository tests create fresh in-memory tables per `beforeEach`
- Tests live in `tests/` directory mirroring `src/`

## Generated / ignored files

- `src/routeTree.gen.ts` — TanStack Router, auto-regenerated
- `src/db/schemas/auth.ts` — regenerated via `bun run auth:generate`
- `src/db/schemas/index.ts` — auto-barreled by Vite plugin
- `src/components/ui/` — excluded from oxlint + coverage
- `.gitignore` also excludes: `*.db`, `drizzle/`, `coverage/`, `.nitro`, `.tanstack`

## Environment

All vars validated at import time by `@t3-oss/env-core`. See `src/env/server.ts` and `src/env/client.ts` (client prefix: `VITE_`). Required vars include: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DB_FILE_NAME`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY/FROM`, `STRIPE_SECRET_KEY/WEBHOOK_SECRET/MONTHLY_PRICE_ID/YEARLY_PRICE_ID`.

## Verification Processes

- Run `bunx tsgo` to validate the types (or `bun typecheck`)
- Run `bun lint` to validate the linting (and `bun lint --fix` for fixable errors)
- Never use `tsc`, use the modern `tsgo` alternative
