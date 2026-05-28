// sdk/ts/openapi-ts.config.ts
//
// Codegen config for @hey-api/openapi-ts.
//
// - Input:  ../../backend/api/docs/openapi.json (the spec extended by plan 02-01
//           with `permissions[]` and `organization{}` on MeResponse).
// - Output: src/generated/ — typed per-endpoint SDK functions, runtime
//           fetch client, and request/response TypeScript types
//           (D-02: types + SDK functions, no React Query plugin in v1.0).
//
// IMPORTANT — pre-1.0 churn (D-01 / RESEARCH §Pitfall 1):
// This config is empirically verified against @hey-api/openapi-ts@0.97.3 on
// 2026-05-28 by inspecting node_modules/@hey-api/openapi-ts/dist/types-*.d.mts
// and node_modules/.pnpm/.../@hey-api/shared/dist/index.d.mts. The hey-api
// config DSL changes between minor versions. Before bumping the dep, re-verify
// the UserConfig schema and adjust this file accordingly.
//
// Schema notes vs the RESEARCH template:
//  - `output.format` / `output.lint` are DEPRECATED in 0.97.3 — replaced by
//    `output.postProcess: ['prettier']` (presets defined in postProcessors).
//  - `@hey-api/sdk.asClass: false` is DEPRECATED — `operations.strategy: 'flat'`
//    (the default) produces standalone per-endpoint functions. Omitted here
//    because the default already matches D-02.
//  - `@hey-api/client-fetch` is a valid plugin name; the standalone npm package
//    is deprecated (bundled into openapi-ts since v0.73.0) but the plugin lives
//    inside openapi-ts proper.
//
// DO NOT hand-edit files in sdk/ts/src/generated/.
// See sdk/ts/README.md.
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../backend/api/docs/openapi.json',
  output: {
    path: 'src/generated',
    postProcess: ['prettier'],
  },
  plugins: [
    // Runtime fetch client — emits client.gen.ts with a configurable instance
    // that src/api/client.ts will wrap with interceptors in plan 02-03.
    '@hey-api/client-fetch',
    // Per-endpoint SDK functions (flat strategy = standalone functions, D-02).
    '@hey-api/sdk',
    // Request/response TypeScript types (includes the D-16 MeResponse with
    // `permissions: string[]` and `organization?: { id, name }`).
    '@hey-api/typescript',
  ],
});
