/**
 * Cryptographic functions using the Web Crypto API.
 */

// --- Configuration ---
const KDF_ITERATIONS = 100000 // Number of iterations for PBKDF2
const KDF_HASH = 'SHA-256' // Hash function for PBKDF2
const SALT_LENGTH_BYTES = 16 // Recommended length for salt
const AES_ALGORITHM = 'AES-GCM' // AES Galois/Counter Mode
const AES_KEY_LENGTH_BITS = 256 // AES key length (128, 192, or 256)
const IV_LENGTH_BYTES = 12 // Recommended length for AES-GCM IV

// --- Helper Functions ---

/**
 * Converts a Base64 string to a Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    console.error('Failed to decode base64 string:', base64, error)
    throw new Error('Invalid Base64 string for decoding.')
  }
}

/**
 * Converts a Uint8Array to a Base64 string.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Converts a string to a Uint8Array (UTF-8 encoded).
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * Converts a Uint8Array to a string (UTF-8 decoded).
 */
function uint8ArrayToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

// Export the base64 helper
export { uint8ArrayToBase64 }

// --- Interfaces ---

export interface MasterKeyResult {
  masterKey: CryptoKey // The derived CryptoKey object
  salt: Uint8Array // The salt used for derivation
}

export interface EncryptedPayload {
  version: number
  salt: string // Base64 encoded salt used for KDF
  iv: string // Base64 encoded initialization vector
  ciphertext: string // Base64 encoded ciphertext
}

// --- Core Crypto Functions ---

/**
 * Generate cryptographically secure random bytes.
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * Derive a master CryptoKey from the user's password using PBKDF2.
 * If no salt is provided, a random salt is generated.
 */
export async function deriveMasterKey(
  password: string,
  saltBytes?: Uint8Array
): Promise<MasterKeyResult> {
  const salt = saltBytes ?? randomBytes(SALT_LENGTH_BYTES)
  const passwordBuffer = stringToUint8Array(password)

  // Import the password as a raw key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false, // not extractable
    ['deriveKey'] // usage
  )

  // Derive the AES key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: KDF_ITERATIONS,
      hash: KDF_HASH,
    },
    baseKey,
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH_BITS },
    true, // make the key extractable if needed later (false is safer)
    ['encrypt', 'decrypt'] // key usages
  )

  return { masterKey: derivedKey, salt }
}

/**
 * Encrypt a UTF-8 string using AES-GCM.
 */
export async function encryptField(
  plaintext: string,
  masterKey: CryptoKey, // Expects the CryptoKey object
  salt: Uint8Array // Pass the original KDF salt for storage
): Promise<EncryptedPayload> {
  const iv = randomBytes(IV_LENGTH_BYTES)
  const plaintextBuffer = stringToUint8Array(plaintext)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv: iv,
    },
    masterKey,
    plaintextBuffer
  )

  return {
    version: 2, // Indicate Web Crypto API version
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
  }
}

/**
 * Decrypt an EncryptedPayload using AES-GCM.
 * Requires the original password to re-derive the key.
 */
export async function decryptField(
  payload: EncryptedPayload,
  password: string // Password needed to re-derive the key
): Promise<string> {
  if (!payload || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error('Invalid encrypted payload structure.')
  }

  const saltBytes = base64ToUint8Array(payload.salt)
  const ivBytes = base64ToUint8Array(payload.iv)
  const ciphertextBytes = base64ToUint8Array(payload.ciphertext)

  // Re-derive the master key using the stored salt
  const { masterKey } = await deriveMasterKey(password, saltBytes)

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: AES_ALGORITHM,
        iv: ivBytes,
      },
      masterKey,
      ciphertextBytes
    )
    return uint8ArrayToString(new Uint8Array(decryptedBuffer))
  } catch (error) {
    console.error('Decryption failed:', error)
    // Handle potential decryption errors (e.g., wrong key, tampered data)
    throw new Error('Decryption failed. Invalid password or corrupted data.')
  }
}
