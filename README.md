# Peaknode TypeScript SDK

TypeScript client for the [Peaknode](https://github.com/Kildall/peaknode) Proof
of Reserves API. Generated from the backend OpenAPI 3.0 spec
(`backend/api/docs/openapi.json`) via [`@hey-api/openapi-ts`](https://heyapi.dev) —
never hand-edited.

Package name: `@kildall/peaknode-sdk-ts` (mirrors the Go SDK module
`github.com/kildall/peaknode-sdk-go`).

## Installation

```bash
pnpm add @kildall/peaknode-sdk-ts
# or: npm install @kildall/peaknode-sdk-ts
```

Inside this monorepo the dashboard consumes the SDK via the pnpm workspace
(`"@kildall/peaknode-sdk-ts": "workspace:*"`) — the TS analog of the Go SDK's
`go.work` replace directive.

## Usage

```ts
import { client, getAuthMe, postAuthLogin } from '@kildall/peaknode-sdk-ts';

// Configure the runtime client once at startup.
client.setConfig({
  baseUrl: 'https://api.peaknode.ar',
  throwOnError: true,
});

const me = await getAuthMe();
```

The package exports:

- every generated per-endpoint SDK function (`getAuthMe`, `postAuthLogin`, …),
- the request/response TypeScript types, and
- the configurable `@hey-api/client-fetch` runtime `client` instance.

Consumers own client configuration (base URL, headers, interceptors). The SDK
ships the *unconfigured* client; the dashboard wraps it with auth-header
injection, 401 single-flight refresh, and 403 handling in
`dashboard/src/api/client.ts`.

## Codegen

The generated tree under `src/generated/` is regenerated from the backend spec:

```bash
just backend swagger      # produce backend/api/docs/openapi.json from swag annotations
just ts api-client        # regenerate sdk/ts/src/generated/ via @hey-api/openapi-ts
just ts drift-check        # assert the generated tree matches the spec (CI gate)
just ts build              # emit dist/ (JS + .d.ts) for external npm consumers
```

`just ts api-client` reapplies the `// @ts-nocheck` header to every generated
file (the consuming dashboard's strict tsconfig excludes the SDK from its
type-check surface). The `.prettierrc` in this package fixes the codegen output
formatting so drift-check stays stable.

**NEVER hand-edit files under `src/generated/`.** They are overwritten on every
regen. If the generated shape is wrong, fix the OpenAPI annotations in
`backend/api/`, regenerate, and commit both sides together.

## Runtime dependencies

None. The `@hey-api` fetch client source is vendored into `src/generated/client/`
and `src/generated/core/`, so the package has zero runtime npm dependencies.
`@hey-api/openapi-ts`, `@hey-api/client-fetch`, `prettier`, and `typescript` are
devDependencies (codegen / build only) and are exact-pinned for the two
pre-1.0 hey-api packages.

## Release / Ops

Releases are driven by the `VERSION` file (mirrors `sdk/go/VERSION` → release
tag). To cut a release:

1. Bump `sdk/ts/VERSION` (e.g. `0.1.0` → `0.2.0`) and commit.
2. On push to `main`, `.github/workflows/sdk-ts-publish.yml` builds `dist/` and
   publishes to npm **only if** `VERSION` differs from the version already on
   the registry (idempotent re-runs).

### Out-of-scope manual ops (the publish workflow is INERT until these land)

The publish workflow is scaffolded but does **not** function until the
following one-time ops steps are completed by a maintainer:

1. **Create the npm `@kildall` org/scope** on [npmjs.com](https://www.npmjs.com)
   (the scope must exist before a scoped package can be published).
2. **Generate an npm Automation token** and add it to the GitHub repository as
   the secret `NPM_TOKEN`. The workflow wires it via `NODE_AUTH_TOKEN`; no
   `.npmrc` with secrets is committed.
3. **(Optional) Reserve the name** with an initial manual `pnpm publish` from
   `sdk/ts/` once the scope + token exist.

`publishConfig.access: "public"` in `package.json` is mandatory for a scoped
public package — without it, `npm publish` defaults to `restricted` and fails
on a free account.

## License

MIT.
