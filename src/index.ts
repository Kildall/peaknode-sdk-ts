// Public entry point for @kildall/peaknode-sdk-ts.
//
// Re-exports the generated per-endpoint SDK functions and request/response
// types plus the configurable runtime `client` instance. Import everything
// from this single module rather than reaching into ./generated/* directly.
//
// The ./generated tree is produced from the OpenAPI spec — never hand-edit it.

// All SDK functions + request/response types.
export * from './generated';

// The configurable runtime client instance. Consumers that configure the
// client (baseUrl, interceptors, etc.) import it from here.
export { client } from './generated/client.gen';
