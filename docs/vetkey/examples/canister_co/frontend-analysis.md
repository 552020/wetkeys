# VetKey Frontend Flow Analysis

## Overview

This document provides a comprehensive analysis of how VetKey (Verifiable Threshold Key Derivation) is implemented in the frontend for file encryption and decryption. The system uses Identity-Based Encryption (IBE) where files are encrypted using the user's principal as the identity.

## Key Libraries and Dependencies

### Primary VetKey Library

```json
{
  "ic-vetkd-utils": "file:./ic-vetkd-utils-0.1.0.tgz"
}
```

### Supporting DFINITY Libraries

```json
{
  "@dfinity/agent": "^2.3.0",
  "@dfinity/auth-client": "^2.2.0",
  "@dfinity/principal": "^2.3.0",
  "@dfinity/candid": "^2.3.0"
}
```

## Core VetKey Service

### File: `frontend/src/frontend/src/lib/vetkeys/vetkdCrypto.ts`

This is the **single source of truth** for all VetKey operations in the frontend.

```typescript
import * as vetkd from "ic-vetkd-utils";
import type { ActorType } from "$lib/shared/actor";

export class VetkdCryptoService {
  constructor(private actor: ActorType) {}

  // Encryption method
  async encrypt(data: ArrayBuffer, userPrincipalBytes: Uint8Array): Promise<Uint8Array>;

  // Decryption method
  async decrypt(encryptedData: Uint8Array, userPrincipalBytes: Uint8Array, fileId: bigint): Promise<Uint8Array>;
}
```

## Encryption Flow

### 1. Entry Point: Upload Service

**File**: `frontend/src/frontend/src/lib/services/upload.ts`

```typescript
// Line 85-96
onStarted(0); // Show start progress while encrypting
const encryptedData = await this.vetkdCryptoService.encrypt(fileBytes, userPrincipalBytes);
```

### 2. Encryption Process in VetkdCryptoService

```typescript
async encrypt(data: ArrayBuffer, userPrincipalBytes: Uint8Array): Promise<Uint8Array> {
  try {
    // Step 1: Get public key from backend
    const publicKeyResponse = await this.actor.vetkd_public_key();
    if (!publicKeyResponse || "Err" in publicKeyResponse) {
      throw new Error("Error getting public key...");
    }
    const publicKey = publicKeyResponse.Ok as Uint8Array;

    // Step 2: Generate random seed for encryption
    const seed = window.crypto.getRandomValues(new Uint8Array(32));

    // Step 3: Transform data to Uint8Array
    const encodedMessage = new Uint8Array(data);

    // Step 4: Encrypt using VetKey IBE
    const encryptedData = vetkd.IBECiphertext.encrypt(
      publicKey,           // Backend's public key
      userPrincipalBytes,  // User's principal as identity
      encodedMessage,      // File data
      seed,               // Random seed
    );

    // Step 5: Return serialized encrypted data
    return encryptedData.serialize();
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}
```

### 3. Backend API Calls for Encryption

#### `vetkd_public_key()`

- **Purpose**: Retrieves the public key from the backend
- **Backend Method**: `vetkd_public_key()`
- **Response Type**: `VetkdPublicKeyResponse`
- **Usage**: Used to encrypt files with IBE

```typescript
// Backend interface
'vetkd_public_key' : ActorMethod<[], VetkdPublicKeyResponse>

// Response type
export type VetkdPublicKeyResponse =
  | { 'Ok' : Uint8Array | number[] }
  | { 'Err' : string };
```

## Decryption Flow

### 1. Entry Point: Decrypt Service

**File**: `frontend/src/frontend/src/lib/services/decrypt.ts`

```typescript
// Line 130-135
const decryptedData = await this.vetkdCryptoService.decrypt(
  downloadedFile.found_file.contents as Uint8Array,
  userPrincipalBytes,
  fileId
);
```

### 2. Decryption Process in VetkdCryptoService

```typescript
async decrypt(encryptedData: Uint8Array, userPrincipalBytes: Uint8Array, fileId: bigint): Promise<Uint8Array> {
  try {
    // Step 1: Check if file is shared
    const sharedFiles = await this.actor.get_shared_files();
    const isSharedFile = sharedFiles.some((file) => file.file_id === fileId);

    // Step 2: Generate transport secret key
    const seed = window.crypto.getRandomValues(new Uint8Array(32));
    const transportSecretKey = new vetkd.TransportSecretKey(seed);

    // Step 3: Get public key from backend
    const publicKeyResponse = await this.actor.vetkd_public_key();
    const publicKey = publicKeyResponse.Ok as Uint8Array;

    // Step 4: Determine principal to use (owner for shared files)
    let principalToUse = userPrincipalBytes;
    if (isSharedFile) {
      const ownerPrincipalResponse = await this.actor.get_file_owner_principal(fileId);
      principalToUse = new Uint8Array(ownerPrincipalResponse.Ok);
    }

    // Step 5: Get encrypted decryption key
    const privateKeyResponse = await this.actor.vetkd_encrypted_key(
      transportSecretKey.public_key(),
      [fileId],
    );
    const encryptedKey = privateKeyResponse.Ok as Uint8Array;

    // Step 6: Decrypt the key using transport secret
    const key = transportSecretKey.decrypt(
      encryptedKey,
      publicKey,
      principalToUse,
    );

    // Step 7: Decrypt the file data
    const ibeCiphertext = vetkd.IBECiphertext.deserialize(encryptedData);
    return ibeCiphertext.decrypt(key);
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}
```

### 3. Backend API Calls for Decryption

#### `get_shared_files()`

- **Purpose**: Determines if a file is shared
- **Usage**: Used to determine which principal to use for decryption

#### `get_file_owner_principal(fileId)`

- **Purpose**: Gets the original owner's principal for shared files
- **Usage**: Used when decrypting shared files to use the owner's identity

#### `vetkd_encrypted_key(transportPublicKey, [fileId])`

- **Purpose**: Derives the encrypted decryption key
- **Parameters**:
  - `transportPublicKey`: Public key for secure key transport
  - `[fileId]`: File ID for key derivation
- **Response Type**: `VetkdEncryptedKeyResponse`

```typescript
// Backend interface
'vetkd_encrypted_key' : ActorMethod<
  [Uint8Array | number[], [] | [bigint]],
  VetkdEncryptedKeyResponse
>

// Response type
export type VetkdEncryptedKeyResponse =
  | { 'Ok' : Uint8Array | number[] }
  | { 'Err' : string };
```

## VetKey System API Integration

### File: `frontend/src/declarations/vetkd_system_api/`

The frontend includes declarations for the VetKey System API canister:

#### Key Methods Available:

- `vetkd_public_key`: Get public key for encryption
- `vetkd_derive_encrypted_key`: Derive encrypted keys for decryption

#### Candid Interface:

```candid
type vetkd_curve = variant { bls12_381_g2 };

type vetkd_public_key_args = record {
  canister_id : opt canister_id;
  derivation_path : vec blob;
  key_id : record { curve : vetkd_curve; name : text };
};

type vetkd_derive_encrypted_key_args = record {
  derivation_id : blob;
  encryption_public_key : blob;
  derivation_path : vec blob;
  key_id : record { curve : vetkd_curve; name : text };
};

service : {
  vetkd_public_key : (vetkd_public_key_args) -> (vetkd_public_key_result);
  vetkd_derive_encrypted_key : (vetkd_derive_encrypted_key_args) -> (vetkd_derive_encrypted_key_result);
};
```

## VetKey Utils Library Functions

### From `ic-vetkd-utils`:

#### `IBECiphertext.encrypt(publicKey, identity, message, seed)`

- **Purpose**: Encrypts data using Identity-Based Encryption
- **Parameters**:
  - `publicKey`: Backend's public key
  - `identity`: User's principal bytes
  - `message`: File data to encrypt
  - `seed`: Random seed for encryption

#### `IBECiphertext.deserialize(encryptedData)`

- **Purpose**: Deserializes encrypted data for decryption

#### `IBECiphertext.decrypt(key)`

- **Purpose**: Decrypts data using the derived key

#### `TransportSecretKey(seed)`

- **Purpose**: Creates a transport secret key for secure key exchange
- **Methods**:
  - `public_key()`: Returns public key for backend communication
  - `decrypt(encryptedKey, publicKey, identity)`: Decrypts the derived key

## Complete Flow Summary

### Encryption Flow:

1. **User selects file** → `Upload.svelte`
2. **User clicks upload** → `UploadService.uploadFile()`
3. **Get user principal** → `authClient.getIdentity().getPrincipal()`
4. **Read file data** → `file.arrayBuffer()`
5. **Call VetKey encryption** → `vetkdCryptoService.encrypt()`
6. **Get public key** → `actor.vetkd_public_key()`
7. **Encrypt with IBE** → `vetkd.IBECiphertext.encrypt()`
8. **Serialize result** → `encryptedData.serialize()`
9. **Upload encrypted data** → Backend storage

### Decryption Flow:

1. **User requests file** → `DecryptService.decryptFile()`
2. **Download encrypted data** → `actor.download_file()`
3. **Check if shared** → `actor.get_shared_files()`
4. **Get owner principal** → `actor.get_file_owner_principal()` (if shared)
5. **Create transport key** → `new vetkd.TransportSecretKey(seed)`
6. **Get public key** → `actor.vetkd_public_key()`
7. **Get encrypted key** → `actor.vetkd_encrypted_key()`
8. **Decrypt key** → `transportSecretKey.decrypt()`
9. **Decrypt file** → `ibeCiphertext.decrypt(key)`
10. **Return decrypted data** → `ArrayBuffer`

## Security Features

### Identity-Based Encryption (IBE)

- Files are encrypted using the user's principal as the identity
- Only users with the correct principal can derive the decryption key

### Transport Security

- Uses `TransportSecretKey` for secure key exchange
- Prevents key interception during transmission

### File Sharing Support

- Shared files use the original owner's principal for decryption
- Maintains security while enabling file sharing

### Random Seed Generation

- Uses `window.crypto.getRandomValues()` for cryptographically secure randomness
- Ensures unique encryption for each file

## Error Handling

### Common Error Scenarios:

1. **Public key retrieval failure**: Backend VetKey system unavailable
2. **Key derivation failure**: User not authorized for file
3. **Decryption failure**: Wrong principal or corrupted data
4. **Transport key failure**: Key exchange protocol error

### Error Recovery:

- Graceful fallback to user principal for shared files
- Detailed error messages for debugging
- Browser-specific key storage warnings

## Performance Considerations

### Optimization Strategies:

- **Parallel chunk uploads**: Up to 5 concurrent uploads
- **Lazy key derivation**: Keys derived only when needed
- **Caching**: Public keys cached during session
- **Chunked processing**: Large files processed in 2MB chunks

### Memory Management:

- **Streaming**: File data processed in chunks
- **Cleanup**: Transport keys discarded after use
- **Garbage collection**: Encrypted data cleared after decryption

This VetKey implementation provides a secure, efficient, and user-friendly way to handle file encryption and decryption in the Internet Computer ecosystem.
