# Peaknode TypeScript SDK Module

The TS SDK module (`sdk/ts/`) contains the generated TypeScript API client
derived from the OpenAPI 3.0 spec produced by the API module. It is a
self-contained, independently-publishable npm package
(`@kildall/peaknode-sdk-ts`), mirroring how `sdk/go/` is a standalone Go module.
The `dashboard/` consumes it via the pnpm workspace (`workspace:*`).

## Module Dependencies

| Module | Path | Purpose | Dependencies |
|--------|------|---------|-------------|
| TS SDK | `sdk/ts/` | Generated TypeScript API client | None (leaf — zero runtime deps) |

## File Structure

| File | Purpose |
|------|---------|
| `sdk/ts/package.json` | Package manifest (`@kildall/peaknode-sdk-ts`, `publishConfig.access=public`, exports → `dist/`). |
| `sdk/ts/tsconfig.json` | Editor/IDE config (strict, bundler resolution, no emit). |
| `sdk/ts/tsconfig.build.json` | Build config — emits `dist/` (JS + `.d.ts`) for external npm consumers. |
| `sdk/ts/openapi-ts.config.ts` | `@hey-api/openapi-ts` codegen config (input `../../backend/api/docs/openapi.json`, output `src/generated`). |
| `sdk/ts/.prettierrc` | Prettier config — fixes codegen output formatting so drift-check is stable. |
| `sdk/ts/.node-version` | Node pin (24) for the publish workflow. |
| `sdk/ts/VERSION` | Release driver (= `0.1.0`); the publish workflow keys off it. |
| `sdk/ts/justfile` | `api-client` / `drift-check` / `build` / `install` recipes (`just ts <recipe>`). |
| `sdk/ts/src/index.ts` | Public barrel — re-exports generated functions/types + the configurable `client`. |
| `sdk/ts/src/generated/**` | Auto-generated client (DO NOT HAND-EDIT). |

## Generation Workflow

The SDK client is generated from the API module's OpenAPI 3.0 spec:

1. `just backend swagger` — produces the OpenAPI spec from swag annotations in `backend/api/`.
2. `just ts api-client` — regenerates `sdk/ts/src/generated/` from the spec via `@hey-api/openapi-ts`, then reapplies the `// @ts-nocheck` header to every file.
3. `just ts drift-check` — confirms the generated files match the current spec.
4. `just ts build` — emits `dist/` for external npm publishing (the dashboard consumes raw `src/` via the workspace dev alias and does not need this).

**Key rule: NEVER hand-edit files in `src/generated/`.** They are regenerated
from the OpenAPI spec and any manual changes will be overwritten. The CI
drift-check (in `.github/workflows/dashboard.yml`, which owns the drift-check
job and is gated on `sdk/ts/**` + `backend/api/docs/openapi.json`) WILL fail on
manual edits. If the generated shape is wrong, fix the OpenAPI annotations in
`backend/api/`, regenerate, and commit both sides together.

## Drift Check

Run `just ts drift-check` (re-runs codegen, then asserts no diff under
`src/generated/`). Enforced in CI.

## Runtime Dependencies

Zero. The `@hey-api` fetch client source is vendored into `src/generated/`, so
the package needs no `dependencies`. `@hey-api/openapi-ts`,
`@hey-api/client-fetch`, `prettier`, and `typescript` are devDependencies
(codegen/build only); the two pre-1.0 hey-api packages are exact-pinned.

## Release / Ops

Releases are `VERSION`-driven (mirrors `sdk/go/VERSION` → release tag):

1. Bump `sdk/ts/VERSION` and commit.
2. On push to `main`, `.github/workflows/sdk-ts-publish.yml` builds `dist/` and
   publishes to npm **only if** `VERSION` differs from the published version.

### Out-of-scope manual ops (the publish workflow is INERT until these land)

1. **Create the npm `@kildall` org/scope** on npmjs.com (must exist before a
   scoped package can publish).
2. **Generate an npm Automation token** → add it as repo secret `NPM_TOKEN`
   (wired via `NODE_AUTH_TOKEN`; no committed `.npmrc`).
3. **(Optional) Reserve the name** with an initial manual `pnpm publish`.

`publishConfig.access: "public"` is mandatory for a scoped public package.

## Build Artifacts

- `dist/` is a publish artifact, not committed (gitignored). Generate it via
  `just ts build` when publishing.
- **NEVER commit compiled output** beyond the generated `src/generated/` tree.

## Working Tree Safety

- **NEVER reset, checkout, or discard uncommitted working tree changes** without
  explicitly asking the user first. Uncommitted changes represent in-progress
  work that may not exist anywhere else.
- When merging worktree branches, stash or commit local changes first — do not
  `git checkout -- .` or `git reset` to clear conflicts.
- If a merge conflict arises with locally modified files, ask the user how to
  proceed rather than discarding their changes.
