import { createClient, createConfig } from '../generated/client/index.js';

export * from './types.js';
export * from './verify.js';
export * as api from '../generated/sdk.gen.js';

/**
 * Creates a fetch client with no credentials and no auth header, for the /public/v1
 * routes and the well-known key document. Pass it to an operation as `{ client }`.
 */
export function createPublicClient(baseUrl: string) {
  return createClient(createConfig({ baseUrl, credentials: 'omit' }));
}
