import type { KeysDocument, SigFile, SignedEnvelope, Withdrawal } from './types.js';

/**
 * Why a published artifact failed verification. `unsupported` means this runtime cannot
 * check an Ed25519 signature at all, which says nothing about the artifact.
 */
export type VerificationReason =
  | 'hash_mismatch'
  | 'unknown_key'
  | 'key_not_valid'
  | 'bad_signature'
  | 'format'
  | 'unsupported';

/** Thrown when a bundle, feed or withdrawal does not verify. */
export class VerificationError extends Error {
  constructor(
    public readonly reason: VerificationReason,
    message: string,
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

const toHex = (b: ArrayBuffer): string =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

function fromB64(s: unknown, reason: VerificationReason): Uint8Array {
  if (typeof s !== 'string') throw new VerificationError(reason, 'malformed base64 field');
  try {
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  } catch {
    throw new VerificationError(reason, 'malformed base64 field');
  }
}

function fromHex(s: unknown): Uint8Array {
  if (typeof s !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(s)) {
    throw new VerificationError('format', 'malformed hex field');
  }
  return Uint8Array.from(s.match(/../g) ?? [], (h) => parseInt(h, 16));
}

async function verifyDigest(
  keys: KeysDocument,
  keyId: string,
  digest: Uint8Array,
  sig: Uint8Array,
  at: Date,
): Promise<void> {
  const k = keys.keys.find((x) => x.key_id === keyId);
  if (!k) throw new VerificationError('unknown_key', 'signing key is not published');
  if (at < new Date(k.valid_from) || (k.valid_to !== null && at >= new Date(k.valid_to))) {
    throw new VerificationError('key_not_valid', 'signing key was not valid at that time');
  }
  if (k.algorithm !== 'Ed25519') throw new VerificationError('unknown_key', 'signing key is not published');
  const raw = fromB64(k.public_key, 'unknown_key');
  if (raw.length !== 32) throw new VerificationError('unknown_key', 'signing key is not published');
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new VerificationError('unsupported', 'this runtime cannot check Ed25519 signatures');
  let pub: CryptoKey;
  try {
    pub = await subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
  } catch (e) {
    if (isUnsupported(e)) throw new VerificationError('unsupported', 'this runtime cannot check Ed25519 signatures');
    throw new VerificationError('bad_signature', 'signature does not verify');
  }
  let ok: boolean;
  try {
    ok = await subtle.verify({ name: 'Ed25519' }, pub, sig, digest);
  } catch (e) {
    if (isUnsupported(e)) throw new VerificationError('unsupported', 'this runtime cannot check Ed25519 signatures');
    throw new VerificationError('bad_signature', 'signature does not verify');
  }
  if (!ok) throw new VerificationError('bad_signature', 'signature does not verify');
}

function isUnsupported(e: unknown): boolean {
  return e instanceof TypeError || (typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'NotSupportedError');
}

/**
 * Checks bundle.json against its signature file and the published keys.
 *
 * The hash is taken over the exact bytes before anything is parsed. The signing key
 * must have been valid at `at`; pass the publication's `published_at` so a key that was
 * rotated out afterwards still verifies what it signed.
 */
export async function verifyBundle(
  bundle: Uint8Array,
  sig: SigFile,
  keys: KeysDocument,
  at: Date,
): Promise<{ hash: string; keyId: string }> {
  if (sig.algorithm !== 'Ed25519' || sig.bundle_format_version !== 1) {
    throw new VerificationError('format', 'unsupported signature file');
  }
  if (fromHex(sig.bundle_hash).length !== 32) throw new VerificationError('format', 'malformed bundle hash');
  const digest = await crypto.subtle.digest('SHA-256', bundle);
  if (toHex(digest) !== sig.bundle_hash) throw new VerificationError('hash_mismatch', 'bundle does not match its hash');
  await verifyDigest(keys, sig.key_id, new Uint8Array(digest), fromB64(sig.signature, 'bad_signature'), at);
  return { hash: sig.bundle_hash, keyId: sig.key_id };
}

/**
 * Verifies a signed envelope (the feed or a withdrawal) and returns its payload bytes.
 *
 * The payload hash is checked first, then the signature over that digest, with the key
 * judged valid at `at`.
 */
export async function openEnvelope(env: SignedEnvelope, keys: KeysDocument, at: Date): Promise<Uint8Array> {
  if (env.format_version !== 1) throw new VerificationError('format', 'unsupported envelope');
  const payload = fromB64(env.payload, 'format');
  const digest = await crypto.subtle.digest('SHA-256', payload);
  if (toHex(digest) !== env.payload_sha256) {
    throw new VerificationError('hash_mismatch', 'payload does not match its hash');
  }
  await verifyDigest(keys, env.key_id, new Uint8Array(digest), fromB64(env.signature, 'bad_signature'), at);
  return payload;
}

/** Verifies a withdrawal envelope and returns the parsed notice. */
export async function openWithdrawal(env: SignedEnvelope, keys: KeysDocument, at: Date): Promise<Withdrawal> {
  const payload = await openEnvelope(env, keys, at);
  let w: Withdrawal;
  try {
    w = JSON.parse(new TextDecoder().decode(payload)) as Withdrawal;
  } catch {
    throw new VerificationError('format', 'malformed withdrawal');
  }
  if (!w || w.format_version !== 1 || typeof w.code !== 'string' || w.code === '') {
    throw new VerificationError('format', 'malformed withdrawal');
  }
  return w;
}
