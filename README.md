# Peaknode TypeScript SDK

TypeScript client for the Peaknode Proof of Reserves API.

## Installation

```bash
npm install @kildall/peaknode-sdk-ts
```

## Usage

```ts
import { client, getVerifyZkpVk } from '@kildall/peaknode-sdk-ts';

client.setConfig({ baseUrl: 'https://api.peaknode.ar' });

const { data } = await getVerifyZkpVk();
```

The package exports the generated per-endpoint functions, their request/response
types, and a configurable `client`. Configure `baseUrl` (and any auth headers /
interceptors) on the `client` before calling.

## License

MIT — see [LICENSE](LICENSE) for details.
