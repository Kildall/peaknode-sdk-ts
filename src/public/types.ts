/** A published Ed25519 public key with its validity window. */
export interface AttestationKey {
  key_id: string;
  algorithm: 'Ed25519';
  /** Base64 of the 32-byte raw public key. */
  public_key: string;
  valid_from: string;
  valid_to: string | null;
}

/** The document served at /.well-known/peaknode-attestation.json. */
export interface KeysDocument {
  keys: AttestationKey[];
}

/** The detached signature file published next to bundle.json. */
export interface SigFile {
  algorithm: 'Ed25519';
  bundle_format_version: number;
  /** Lowercase hex SHA-256 of the exact bundle bytes. */
  bundle_hash: string;
  key_id: string;
  /** Base64 Ed25519 signature over the raw bundle digest. */
  signature: string;
}

/** A signed wrapper around a payload, used for the feed and withdrawal files. */
export interface SignedEnvelope {
  format_version: number;
  key_id: string;
  /** Base64 payload bytes. */
  payload: string;
  /** Lowercase hex SHA-256 of the decoded payload. */
  payload_sha256: string;
  signature: string;
}

/** The signed notice that retires a publication. */
export interface Withdrawal {
  format_version: number;
  code: string;
  withdrawn_at: string;
  withdrawn_by: string;
  reason: string;
}
