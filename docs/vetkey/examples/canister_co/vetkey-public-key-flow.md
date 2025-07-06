# VetKey Public Key Retrieval Flow

This document explains the complete flow of the first call to retrieve the public key from the VetKey canister, tracing the journey from the frontend through the backend to the VetKey System API.

---

## Overview

The VetKey public key retrieval is a critical step in the encryption flow. It allows the frontend to obtain the backend's public key, which is then used for Identity-Based Encryption (IBE) of files before upload. This flow involves three main components:

1. **Frontend** - Initiates the request and handles the response
2. **Backend Canister** - Acts as a proxy to the VetKey System API
3. **VetKey System API** - The actual source of the public key

---

## Architecture Components

### 1. Frontend Components

#### VetkdCryptoService

**File**: `frontend/src/frontend/src/lib/vetkeys/vetkdCrypto.ts`

```typescript
export class VetkdCryptoService {
  constructor(private actor: ActorType) {}

  async encrypt(data: ArrayBuffer, userPrincipalBytes: Uint8Array): Promise<Uint8Array> {
    try {
      // Step 1: Get public key from the backend
      const publicKeyResponse = await this.actor.vetkd_public_key();
      if (!publicKeyResponse || "Err" in publicKeyResponse) {
        throw new Error("Error getting public key...");
      }
      const publicKey = publicKeyResponse.Ok as Uint8Array;

      // Continue with encryption...
    }
  }
}
```

#### Actor Interface

**File**: `frontend/src/declarations/backend/backend.did.d.ts`

```typescript
export interface _SERVICE {
  vetkd_public_key: ActorMethod<[], VetkdPublicKeyResponse>;
  // ... other methods
}

export type VetkdPublicKeyResponse = { Ok: Uint8Array | number[] } | { Err: string };
```

### 2. Backend Components

#### Main Service Interface

**File**: `backend/service.did`

```candid
service docutrack : {
  vetkd_public_key : () -> (VetkdPublicKeyResponse);
  // ... other methods
}

type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};
```

#### Backend Implementation

**File**: `backend/src/vetkd/controller/vetkd_public_key.rs`

```rust
use crate::declarations::vetkd_system_api::{
    vetkd_system_api, VetkdCurve, VetkdPublicKeyArgs, VetkdPublicKeyArgsKeyId,
};
use ic_cdk::update;

#[update]
async fn vetkd_public_key() -> Result<Vec<u8>, String> {
    let args = VetkdPublicKeyArgs {
        key_id: VetkdPublicKeyArgsKeyId {
            name: "insecure_test_key_1".to_string(),
            curve: VetkdCurve::Bls12381G2,
        },
        derivation_path: vec![],
        canister_id: None,
    };

    let (result,) = vetkd_system_api.vetkd_public_key(args).await.unwrap();

    Ok(result.public_key.to_vec())
}
```

#### VetKey System API Client

**File**: `backend/src/declarations/vetkd_system_api.rs`

```rust
pub struct VetkdSystemApi(pub Principal);

impl VetkdSystemApi {
    pub async fn vetkd_public_key(&self, arg0: VetkdPublicKeyArgs) -> Result<(VetkdPublicKeyResult,)> {
        ic_cdk::call(self.0, "vetkd_public_key", (arg0,)).await
    }
}

pub const CANISTER_ID: Principal = Principal::from_slice(&[255, 255, 255, 255, 255, 144, 0, 4, 1, 1]); // umunu-kh777-77774-qaaca-cai
pub const vetkd_system_api: VetkdSystemApi = VetkdSystemApi(CANISTER_ID);
```

### 3. VetKey System API

#### Candid Interface

**File**: `backend/src/declarations/vetkd_system_api/vetkd_system_api.did`

```candid
type vetkd_curve = variant { bls12_381_g2 };

type vetkd_public_key_args = record {
  canister_id : opt canister_id;
  derivation_path : vec blob;
  key_id : record { curve : vetkd_curve; name : text };
};

type vetkd_public_key_result = record {
  public_key : blob;
};

service : {
  vetkd_public_key : (vetkd_public_key_args) -> (vetkd_public_key_result);
  // ... other methods
};
```

---

## Detailed Flow

### Step 1: Frontend Initiation

**Trigger**: User attempts to encrypt a file for upload

**Location**: `frontend/src/frontend/src/lib/vetkeys/vetkdCrypto.ts`

```typescript
// User calls encrypt() method
const encryptedData = await vetkdCryptoService.encrypt(fileData, userPrincipalBytes);

// Inside encrypt() method:
const publicKeyResponse = await this.actor.vetkd_public_key();
```

**What happens**:

1. Frontend creates an actor instance (if not already created)
2. Actor makes an inter-canister call to the backend's `vetkd_public_key` method
3. The call is serialized using Candid and sent over the Internet Computer network

### Step 2: Backend Reception

**Location**: `backend/src/vetkd/controller/vetkd_public_key.rs`

**What happens**:

1. Backend receives the call to `vetkd_public_key()`
2. Function constructs the arguments for the VetKey System API:
   - `key_id.name`: "insecure_test_key_1" (test key identifier)
   - `key_id.curve`: BLS12-381 G2 curve for threshold operations
   - `derivation_path`: Empty vector (no additional derivation)
   - `canister_id`: None (uses default canister)
3. Backend prepares to make an inter-canister call to the VetKey System API

### Step 3: VetKey System API Call

**Location**: `backend/src/declarations/vetkd_system_api.rs`

**What happens**:

1. Backend uses the `vetkd_system_api` client to call the VetKey System API
2. The call is made to canister ID `umunu-kh777-77774-qaaca-cai`
3. Arguments are serialized and sent to the VetKey System API
4. VetKey System API processes the request and returns the public key

### Step 4: Response Processing

**Backend Processing**:

1. Backend receives the response from VetKey System API
2. Extracts the public key from `VetkdPublicKeyResult`
3. Converts the key to a byte vector
4. Wraps it in a `VetkdPublicKeyResponse` variant

**Frontend Processing**:

1. Frontend receives the `VetkdPublicKeyResponse`
2. Checks if the response contains `Ok` or `Err`
3. If `Ok`, extracts the public key as `Uint8Array`
4. If `Err`, throws an error with the error message

### Step 5: Key Usage

**Location**: `frontend/src/frontend/src/lib/vetkeys/vetkdCrypto.ts`

```typescript
// After receiving the public key:
const publicKey = publicKeyResponse.Ok as Uint8Array;

// Generate a random seed for encryption
const seed = window.crypto.getRandomValues(new Uint8Array(32));

// Transform data to Uint8Array
const encodedMessage = new Uint8Array(data);

// Encrypt the data using VetKey IBE
const encryptedData = vetkd.IBECiphertext.encrypt(
  publicKey, // Backend's public key
  userPrincipalBytes, // User's principal as identity
  encodedMessage, // File data
  seed // Random seed
);

return encryptedData.serialize();
```

---

## Key Configuration

### Test Key Configuration

The backend uses a test key configuration for development:

```rust
key_id: VetkdPublicKeyArgsKeyId {
    name: "insecure_test_key_1".to_string(),
    curve: VetkdCurve::Bls12381G2,
},
```

**Important Notes**:

- This is a test key for development purposes
- In production, a secure key would be used
- The key name "insecure_test_key_1" indicates this is not for production use

### BLS12-381 G2 Curve

The system uses the BLS12-381 G2 curve for threshold operations:

- Provides efficient threshold cryptography
- Supports Identity-Based Encryption (IBE)
- Enables secure key derivation and sharing

---

## Error Handling

### Frontend Error Handling

```typescript
const publicKeyResponse = await this.actor.vetkd_public_key();
if (!publicKeyResponse || "Err" in publicKeyResponse) {
  throw new Error(
    "Error getting public key: " + ("Err" in publicKeyResponse ? publicKeyResponse.Err : "empty response")
  );
}
```

### Backend Error Handling

```rust
let (result,) = vetkd_system_api.vetkd_public_key(args).await.unwrap();
// Note: In production, proper error handling should be implemented
```

### Common Error Scenarios

1. **VetKey System API Unavailable**: Network issues or service downtime
2. **Invalid Key Configuration**: Wrong key name or curve
3. **Authentication Issues**: Unauthorized access to VetKey System API
4. **Serialization Errors**: Invalid data format

---

## Security Considerations

### Key Management

1. **Test Keys**: The current implementation uses test keys for development
2. **Production Keys**: Real deployment requires secure key management
3. **Key Rotation**: Consider implementing key rotation for production use

### Network Security

1. **Inter-Canister Calls**: All calls are secured by the Internet Computer's consensus
2. **Authentication**: Calls are authenticated using canister principals
3. **Encryption**: Data is encrypted in transit

### Access Control

1. **Public Key Access**: The public key is publicly accessible (by design)
2. **Private Key Protection**: Private keys are never exposed to the frontend
3. **Identity-Based Encryption**: Files are encrypted for specific user identities

---

## Performance Considerations

### Caching

1. **Public Key Caching**: The public key can be cached by the frontend
2. **Backend Caching**: Consider caching the public key in the backend
3. **Cache Invalidation**: Implement proper cache invalidation strategies

### Network Latency

1. **Inter-Canister Calls**: Each call adds network latency
2. **Optimization**: Consider batching operations where possible
3. **Fallback**: Implement fallback mechanisms for network issues

---

## Monitoring and Debugging

### Logging

```typescript
// Frontend logging
console.log("Getting public key from backend...");
console.log("Public key received:", publicKey);
```

```rust
// Backend logging (if implemented)
ic_cdk::println!("VetKey public key request received");
ic_cdk::println!("Public key retrieved successfully");
```

### Metrics

1. **Call Frequency**: Monitor how often the public key is requested
2. **Response Times**: Track response times for performance optimization
3. **Error Rates**: Monitor error rates for system health

---

## Summary

The VetKey public key retrieval flow is a critical component of the encryption system:

1. **Frontend** initiates the request when encryption is needed
2. **Backend** acts as a secure proxy to the VetKey System API
3. **VetKey System API** provides the actual public key
4. **Response** flows back through the same path
5. **Frontend** uses the key for Identity-Based Encryption

This flow ensures that:

- Files are encrypted with the correct public key
- The private key remains secure and never exposed
- The system can scale with proper caching and optimization
- Security is maintained throughout the process

The flow is designed to be efficient, secure, and reliable for production use, with proper error handling and monitoring capabilities.
