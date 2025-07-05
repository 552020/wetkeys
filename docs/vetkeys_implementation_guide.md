# Vetkeys Encryption Implementation Guide

## Overview

This document provides implementation details for the **encryption phase** of vetkeys in Internet Computer (ICP) applications. Vetkeys use Identity-Based Encryption (IBE) to encrypt data without traditional key pair generation, instead deriving unique keys from a Master Public Key and a Derivation ID.

## Prerequisites

- ICP full-stack project with dfx
- Backend canister (Rust-based)
- Frontend framework capability
- `ic-vetkd-utils` package
- Basic familiarity with ICP development (canisters, principals, Candid)

## Core Encryption Concepts

### Identity-Based Encryption (IBE)
- **Master Public Key**: Provided by the vetkey system on ICP
- **Derivation ID**: Unique identifier (typically user's Principal) that ties the derived key to a specific identity
- **Encryption Process**: Uses master public key + derivation ID to encrypt data without needing the private key

### Encryption Flow
1. Get vetkd system's master public key from backend
2. Use user's Principal (as bytes) as the derivation ID
3. Use `ic-vetkd-utils` library to encrypt data
4. Store the resulting encrypted blob

## Backend Implementation

### 1. dfx.json Configuration

Add the vetkd system canister to your `dfx.json`:

```json
{
  "canisters": {
    "vetkd_system_api": {
      "candid": "./vetkeys/chainkey_testing_canister.did",
      "type": "custom",
      "wasm": "./vetkeys/chainkey_testing_canister.wasm",
      "declarations": {
        "output": "src/declarations/vetkd_system_api"
      }
    }
  }
}
```

### 2. Candid Interface (service.did)

Define the vetkey method for encryption:

```candid
type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};

service : {
  vetkd_public_key : () -> (VetkdPublicKeyResponse);
}
```

### 3. Rust Backend Implementation

Create a function to fetch the master public key:

```rust
use crate::declarations::vetkd_system_api::{
    vetkd_system_api, VetkdCurve, VetkdPublicKeyArgs, VetkdPublicKeyArgsKeyId,
};
use ic_cdk::update;

#[update]
async fn vetkd_public_key() -> Result<Vec<u8>, String> {
    let args = VetkdPublicKeyArgs {
        key_id: VetkdPublicKeyArgsKeyId {
            // IMPORTANT: Use "key_1" for production, "insecure_test_key_1" for testing
            name: "insecure_test_key_1".to_string(),
            curve: VetkdCurve::Bls12381G2,
        },
        derivation_path: vec![],
        canister_id: None,
    };

    let (result,) = vetkd_system_api
        .vetkd_public_key(args)
        .await
        .map_err(|e| format!("vetkd_public_key failed: {:?}", e))?;

    Ok(result.public_key.to_vec())
}
```

## Frontend Implementation

### 1. Package Installation

Install the required package:

```json
{
  "dependencies": {
    "ic-vetkd-utils": "file:./ic-vetkd-utils-0.1.0.tgz"
  }
}
```

### 2. Vetkey Crypto Service

Create a service class for encryption operations:

```typescript
import * as vetkd from "ic-vetkd-utils";
import type { ActorType } from "$lib/shared/actor";

export class VetkdCryptoService {
    constructor(private actor: ActorType) {}

    async encrypt(
        data: ArrayBuffer,
        userPrincipalBytes: Uint8Array,
    ): Promise<Uint8Array> {
        try {
            // 1. Get vetkd public key from backend
            const publicKeyResponse = await this.actor.vetkd_public_key();
            if (!publicKeyResponse || "Err" in publicKeyResponse) {
                throw new Error(
                    "Error getting public key: " +
                        ("Err" in publicKeyResponse
                            ? publicKeyResponse.Err
                            : "empty response"),
                );
            }
            const vetkdPublicKey = publicKeyResponse.Ok as Uint8Array;

            // 2. Generate random seed (required by library)
            const seed = window.crypto.getRandomValues(new Uint8Array(32));

            // 3. Convert data to Uint8Array
            const encodedMessage = new Uint8Array(data);

            // 4. Encrypt using IBE
            const encryptedData = vetkd.IBECiphertext.encrypt(
                vetkdPublicKey,
                userPrincipalBytes, // Derivation ID
                encodedMessage,
                seed,
            );

            // 5. Serialize for storage/transport
            return encryptedData.serialize();
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }
}
```

### 3. Upload Service Integration

Example integration with file upload:

```typescript
import { VetkdCryptoService } from "../vetkeys/vetkdCrypto";

export const CHUNK_SIZE = 2_000_000;

export class UploadService {
    private vetkdCryptoService: VetkdCryptoService;

    async uploadFile({ file }: { file: File }) {
        // Get user's principal as derivation ID
        const userPrincipalBytes = this.auth.authClient
            .getIdentity()
            .getPrincipal()
            .toUint8Array();

        // Convert file to ArrayBuffer
        const fileBytes = await file.arrayBuffer();

        // Encrypt the data
        const encryptedData = await this.vetkdCryptoService.encrypt(
            fileBytes,
            userPrincipalBytes,
        );

        // Upload encrypted data (chunked if necessary)
        const numChunks = Math.ceil(encryptedData.length / CHUNK_SIZE);
        const firstChunk = encryptedData.subarray(0, CHUNK_SIZE);

        const fileId = await this.auth.actor.upload_file_atomic({
            content: firstChunk,
            name: file.name,
            file_type: file.type,
            num_chunks: BigInt(numChunks),
        });

        // Upload remaining chunks if needed
        await this.uploadRemainingChunks(encryptedData, fileId);
        
        return fileId;
    }

    private async uploadRemainingChunks(
        content: Uint8Array, 
        fileId: bigint
    ) {
        const numChunks = Math.ceil(content.length / CHUNK_SIZE);
        
        for (let i = 1; i < numChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, content.length);
            const chunk = content.subarray(start, end);
            
            await this.auth.actor.upload_file_continue({
                file_id: fileId,
                chunk_index: BigInt(i),
                content: chunk,
            });
        }
    }
}
```

## Key Implementation Points

### Critical Configuration
- **Key ID**: Use `"insecure_test_key_1"` for testing, `"key_1"` for production
- **Curve**: Always use `VetkdCurve::Bls12381G2`
- **Derivation ID**: Consistently use the same identifier (user's principal) for related operations

### Data Flow
1. **Frontend**: Request master public key from backend
2. **Backend**: Fetch master public key from vetkd system API
3. **Frontend**: Use master public key + user principal to encrypt data
4. **Storage**: Store encrypted blob (chunked if necessary)

### Error Handling Requirements
- Handle backend API call failures
- Validate public key responses
- Manage encryption library errors
- Implement retry mechanisms for network failures

### Security Considerations
- Never expose private keys in frontend
- Use secure random seed generation
- Validate all inputs before encryption
- Implement proper error logging without exposing sensitive data

## Testing Approach

### Unit Tests
- Test public key retrieval from backend
- Verify encryption with known inputs
- Test error handling scenarios

### Integration Tests
- End-to-end encryption flow
- File upload with encryption
- Chunk handling for large files

### Security Tests
- Verify encrypted data is not readable without decryption
- Test with different derivation IDs
- Validate proper key isolation

## Common Pitfalls

1. **Key ID Mismatch**: Ensure same key ID used across encryption/decryption
2. **Derivation ID Consistency**: Always use same derivation ID for related operations
3. **Seed Generation**: Use cryptographically secure random seed
4. **Error Handling**: Implement comprehensive error handling for all async operations
5. **Data Serialization**: Properly serialize encrypted data for storage/transport

## Next Steps

After implementing encryption, the next phase will cover:
- Decryption key derivation
- Transport key management
- Secure key exchange with backend
- Data decryption and reconstruction

This encryption implementation provides the foundation for secure, decentralized data encryption in ICP applications using vetkeys.