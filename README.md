# Peaknode TypeScript SDK

TypeScript client for the Peaknode Proof of Reserves API.

## Installation

```bash
npm install @kildall/peaknode-sdk-ts
```

## Usage

```ts
import { client, getVerifyVk } from '@kildall/peaknode-sdk-ts';

client.setConfig({ baseUrl: 'https://api.peaknode.ar' });

const { data } = await getVerifyVk();
```

The package exports the generated per-endpoint functions, their request/response
types, and a configurable `client`. Configure `baseUrl` (and any auth headers /
interceptors) on the `client` before calling.

## Verifying published proofs offline

`@kildall/peaknode-sdk-ts/public` needs no credentials. It exports
`createPublicClient(baseUrl)` for the public routes and the well-known key
document, and `verifyBundle`, `openEnvelope` and `openWithdrawal`, which check a
published bundle, feed or withdrawal against the attestation keys with Ed25519
through `crypto.subtle` (Node 24 or a browser with Ed25519 support). A failure
throws `VerificationError` with a `reason`.

```ts
import { verifyBundle } from '@kildall/peaknode-sdk-ts/public';

const { hash, keyId } = await verifyBundle(bundleBytes, sig, keys, new Date(publishedAt));
```

## License

MIT — see [LICENSE](LICENSE) for details.
