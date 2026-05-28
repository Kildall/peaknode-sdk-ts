# Peaknode TypeScript SDK (@kildall/peaknode-sdk-ts)

default:
    @just --list

# --- Dev ---

# Install dependencies (run from repo root for the workspace; this is the
# module-local convenience target).
[group('dev')]
install:
    pnpm install

# --- Build ---

# Emit dist/ (JS + .d.ts) via tsc for external npm consumers. The dashboard
# consumes the raw src/ via the workspace dev alias, so this is only needed
# for publishing.
[group('build')]
build:
    pnpm exec tsc -p tsconfig.build.json

# --- Codegen ---

# Regenerate the TypeScript API client from backend/api/docs/openapi.json
# using @hey-api/openapi-ts (config: sdk/ts/openapi-ts.config.ts).
# Output: sdk/ts/src/generated/*.gen.ts (committed; do NOT hand-edit).
#
# Post-step: prepend `// @ts-nocheck` to every emitted .ts file so the
# consuming dashboard's strict tsconfig.app.json (exactOptionalPropertyTypes:true)
# doesn't reject hey-api's loose generated types. Mirrors the shadcn
# pattern in dashboard/src/components/ui/**. This must stay in api-client (not
# drift-check) so the header lands in both the commit and the diff baseline.
[group('codegen')]
api-client:
    pnpm exec openapi-ts
    @find src/generated -type f -name "*.ts" | while read f; do \
        if ! head -1 "$f" | grep -q "@ts-nocheck"; then \
            tmp=$(mktemp); \
            printf '// @ts-nocheck — vendored hey-api codegen output; the consuming\n// dashboard tsconfig.app.json excludes the SDK from its strict type-check\n// surface. Regenerate via `just ts api-client`; this header is re-applied\n// as a post-codegen step.\n' > "$tmp"; \
            cat "$f" >> "$tmp"; \
            mv "$tmp" "$f"; \
        fi; \
    done

# Verify the generated API client is in sync with the OpenAPI spec.
# Re-runs codegen, then asserts no diff under src/generated/.
# CI gate (.github/workflows/dashboard.yml owns the drift-check job).
[group('codegen')]
drift-check: api-client
    git diff --exit-code -- src/generated/
