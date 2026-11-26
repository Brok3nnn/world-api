# 0004 — One managed Postgres with auth and storage; typed schema; in-process database for tests

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

The system needs a relational system of record, user sign-in and file storage, in an EU region,
with as little to operate as possible. Every change must be verifiable without external
services.

## Decision

Use Supabase for Postgres, authentication and storage, in an EU region. Define the schema and
all queries in `packages/db` with Drizzle ORM and generated SQL migrations. Run tests and local
proofs on an in-process Postgres (PGlite).

- All data access is server-side through `packages/db`. The hosted data API is not used.
- Row-level security is enabled on every table with no permissive policy.
- Accounts reference an auth user by id without a cross-schema foreign key, so the schema
  applies to any Postgres.

## Consequences

- One service to create and pay for; sign-in and storage are available when they are needed.
- Schema, migrations and queries are typed, reviewed and tested in the repository.
- Tests need no container and no account.
- Features specific to the hosted platform must be reached through adapters, never from pure
  code.

## Alternatives considered

- Separate managed Postgres and separate auth: more flexible, more to set up and maintain.
- Using the hosted client and data API directly: less code, but queries and policies would
  live outside the typed, tested schema.
