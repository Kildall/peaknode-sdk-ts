// sdk/ts/src/index.ts
//
// Public entry point for @kildall/peaknode-sdk-ts.
//
// Re-exports the generated per-endpoint SDK functions and request/response
// types (from the generated barrel) plus the configurable runtime `client`
// instance. Consumers (the dashboard, external npm users) import everything
// from this single module rather than reaching into ./generated/* directly.
//
// The generated tree under ./generated is produced by `just ts api-client`
// from backend/api/docs/openapi.json — never hand-edit it. See README.md.

// All SDK functions + request/response types (the generated index.ts barrel
// re-exports from ./sdk.gen and ./types.gen).
export * from './generated';

// The configurable @hey-api/client-fetch runtime instance. The generated
// barrel does NOT export it; consumers that configure the client (baseUrl,
// interceptors, etc.) import it from here.
export { client } from './generated/client.gen';
