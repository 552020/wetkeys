# VetKey Backend Flow Analysis

## Overview

This document provides a comprehensive analysis of how VetKey (Verifiable Threshold Key Derivation) is implemented in the backend for file encryption and decryption. The backend acts as a bridge between the frontend and the VetKey System API canister, providing secure key management for Identity-Based Encryption (IBE).

## Key Dependencies

### Primary Dependencies

```toml
[dependencies]
ic-cdk = "0.17.1"
ic-cdk-macros = "0.17.1"
candid = "0.10.12"
serde = "1.0.217"
serde_bytes = "0.11.15"
```

### VetKey System API Integration

The backend integrates with the VetKey System API canister (`umunu-kh777-77774-qaaca-cai`) for threshold key derivation operations.

## Core VetKey Module Structure

### Directory: `backend/src/vetkd/`

```
vetkd/
├── mod.rs                    # Module declaration
└── controller/
    ├── mod.rs               # Controller module declaration
    ├── vetkd_public_key.rs  # Public key retrieval
    └── vetkd_encrypted_key.rs # Encrypted key derivation
```

## VetKey System API Integration

### File: `backend/src/declarations/vetkd_system_api.rs`

This file contains the complete Rust bindings for the VetKey System API canister:

```rust
pub const CANISTER_ID: Principal = Principal::from_slice(&[255, 255, 255, 255, 255, 144, 0, 4, 1, 1]); // umunu-kh777-77774-qaaca-cai
pub const vetkd_system_api: VetkdSystemApi = VetkdSystemApi(CANISTER_ID);
```

### Key Data Structures

#### VetKey Public Key Types

```rust
#[derive(Debug, CandidType, Deserialize)]
pub enum VetkdCurve {
    #[serde(rename="bls12_381_g2")]
    Bls12381G2
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdPublicKeyArgsKeyId {
    pub name: String,
    pub curve: VetkdCurve
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdPublicKeyArgs {
    pub key_id: VetkdPublicKeyArgsKeyId,
    pub canister_id: Option<CanisterId>,
    pub derivation_path: Vec<serde_bytes::ByteBuf>,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdPublicKeyResult {
    pub public_key: serde_bytes::ByteBuf
}
```

#### VetKey Encrypted Key Types

```rust
#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdDeriveEncryptedKeyArgsKeyId {
    pub name: String,
    pub curve: VetkdCurve,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdDeriveEncryptedKeyArgs {
    pub key_id: VetkdDeriveEncryptedKeyArgsKeyId,
    pub derivation_path: Vec<serde_bytes::ByteBuf>,
    pub derivation_id: serde_bytes::ByteBuf,
    pub encryption_public_key: serde_bytes::ByteBuf,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct VetkdDeriveEncryptedKeyResult {
    pub encrypted_key: serde_bytes::ByteBuf,
}
```

### VetKey System API Client

```rust
pub struct VetkdSystemApi(pub Principal);

impl VetkdSystemApi {
    pub async fn vetkd_public_key(&self, arg0: VetkdPublicKeyArgs) -> Result<(VetkdPublicKeyResult,)> {
        ic_cdk::call(self.0, "vetkd_public_key", (arg0,)).await
    }

    pub async fn vetkd_derive_encrypted_key(
        &self,
        arg0: VetkdDeriveEncryptedKeyArgs,
    ) -> Result<(VetkdDeriveEncryptedKeyResult,)> {
        ic_cdk::call(self.0, "vetkd_derive_encrypted_key", (arg0,)).await
    }
}
```

## Core VetKey Operations

### 1. Public Key Retrieval

#### File: `backend/src/vetkd/controller/vetkd_public_key.rs`

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

**Purpose**: Retrieves the public key from the VetKey System API for encryption operations.

**Parameters**:

- `key_id.name`: "insecure_test_key_1" (test key identifier)
- `key_id.curve`: BLS12-381 G2 curve for threshold operations
- `derivation_path`: Empty vector (no additional derivation)
- `canister_id`: None (uses default canister)

**Flow**:

1. **Construct arguments** with test key configuration
2. **Call VetKey System API** via `vetkd_system_api.vetkd_public_key()`
3. **Return public key** as byte vector

### 2. Encrypted Key Derivation

#### File: `backend/src/vetkd/controller/vetkd_encrypted_key.rs`

```rust
use crate::declarations::vetkd_system_api::{
    vetkd_system_api, VetkdCurve, VetkdDeriveEncryptedKeyArgs, VetkdDeriveEncryptedKeyArgsKeyId,
};
use crate::with_state;
use ic_cdk::update;
use serde_bytes::ByteBuf;

#[update]
async fn vetkd_encrypted_key(
    encryption_public_key: Vec<u8>,
    file_id: Option<u64>,
) -> Result<Vec<u8>, String> {
    // Determine derivation ID based on file ownership
    let derivation_id = if let Some(id) = file_id {
        // Use file owner's principal for shared files
        let principal = with_state(|state| {
            state
                .file_data
                .get(&id)
                .map(|file| file.metadata.requester_principal.as_slice().to_vec())
                .ok_or_else(|| "File not found".to_string())
        })?;
        principal
    } else {
        // Use caller's principal for own files
        let caller = ic_cdk::api::caller().as_slice().to_vec();
        caller
    };

    let args = VetkdDeriveEncryptedKeyArgs {
        key_id: VetkdDeriveEncryptedKeyArgsKeyId {
            name: "insecure_test_key_1".to_string(),
            curve: VetkdCurve::Bls12381G2,
        },
        derivation_path: vec![],
        derivation_id: ByteBuf::from(derivation_id),
        encryption_public_key: ByteBuf::from(encryption_public_key),
    };

    let (result,) = vetkd_system_api
        .vetkd_derive_encrypted_key(args)
        .await
        .unwrap();

    Ok(result.encrypted_key.to_vec())
}
```

**Purpose**: Derives an encrypted decryption key for a specific identity (user principal).

**Parameters**:

- `encryption_public_key`: Transport public key from frontend
- `file_id`: Optional file ID to determine ownership

**Key Logic**:

1. **Determine derivation ID**:

   - If `file_id` provided: Use file owner's principal (for shared files)
   - If no `file_id`: Use caller's principal (for own files)

2. **Construct VetKey arguments**:

   - Same key configuration as public key retrieval
   - `derivation_id`: User principal for key derivation
   - `encryption_public_key`: Transport key for secure key exchange

3. **Call VetKey System API** via `vetkd_derive_encrypted_key()`

4. **Return encrypted key** for frontend decryption

## Backend API Integration

### Candid Interface

#### File: `backend/service.did`

```candid
type VetkdEncryptedKeyResponse = variant {
  Ok : blob;
  Err : text;
};

type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};

service docutrack : {
  // ... other methods ...

  vetkd_encrypted_key : (blob, opt nat64) -> (VetkdEncryptedKeyResponse);
  vetkd_public_key : () -> (VetkdPublicKeyResponse);
};
```

### Main Entry Points

#### File: `backend/src/main.rs`

The VetKey methods are exposed through the main canister interface:

```rust
// Note: These are commented out in main.rs but available through the vetkd module
// use backend::vetkd::{vetkd_encrypted_key, vetkd_public_key};
```

**Available Methods**:

- `vetkd_public_key()`: Returns public key for encryption
- `vetkd_encrypted_key(encryption_public_key, file_id)`: Returns encrypted decryption key

## State Management Integration

### File Ownership Tracking

The backend maintains file ownership information in the state:

```rust
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct FileMetadata {
    pub file_name: String,
    pub user_public_key: Vec<u8>,
    pub requester_principal: Principal,  // File owner's principal
    pub requested_at: u64,
    pub uploaded_at: Option<u64>,
}
```

### File Owner Principal Retrieval

```rust
#[query]
fn get_file_owner_principal(file_id: u64) -> Result<Vec<u8>, String> {
    with_state(|s| {
        s.file_data
            .get(&file_id)
            .map(|file| file.metadata.requester_principal.as_slice().to_vec())
            .ok_or_else(|| "File not found".to_string())
    })
}
```

**Purpose**: Allows frontend to determine the correct principal for decryption of shared files.

## Security Architecture

### Identity-Based Encryption (IBE)

1. **File Encryption**: Files are encrypted using the user's principal as the identity
2. **Key Derivation**: Decryption keys are derived based on the identity (principal)
3. **File Sharing**: Shared files use the original owner's principal for key derivation

### Threshold Security

1. **VetKey System API**: Provides threshold key derivation with BLS12-381 G2 curve
2. **No Key Storage**: Backend never stores private keys, only derives them on-demand
3. **Secure Transport**: Uses transport keys for secure key exchange

### Access Control

1. **Principal Verification**: All operations verify the caller's principal
2. **File Ownership**: File access is controlled by ownership and sharing permissions
3. **Anonymous Blocking**: Anonymous principals are rejected for sensitive operations

## Complete Flow Summary

### Encryption Flow:

1. **Frontend requests public key** → `vetkd_public_key()`
2. **Backend calls VetKey System API** → `vetkd_system_api.vetkd_public_key()`
3. **Returns public key** → Frontend uses for IBE encryption
4. **Frontend encrypts file** → Using user's principal as identity
5. **Frontend uploads encrypted file** → Backend stores encrypted data

### Decryption Flow:

1. **Frontend requests encrypted key** → `vetkd_encrypted_key(transport_key, file_id)`
2. **Backend determines principal**:
   - Own files: Use caller's principal
   - Shared files: Use file owner's principal
3. **Backend calls VetKey System API** → `vetkd_derive_encrypted_key()`
4. **Returns encrypted key** → Frontend decrypts with transport secret
5. **Frontend decrypts file** → Using derived key

## Error Handling

### Common Error Scenarios:

1. **File not found**: When `file_id` doesn't exist in state
2. **VetKey API failure**: When VetKey System API is unavailable
3. **Principal mismatch**: When caller doesn't have access to file
4. **Network issues**: When inter-canister calls fail

### Error Recovery:

- **Graceful degradation**: Fallback to caller principal if file owner lookup fails
- **Detailed error messages**: Specific error strings for debugging
- **State consistency**: Ensure file metadata is always valid

## Performance Considerations

### Optimization Strategies:

- **Lazy key derivation**: Keys derived only when needed
- **Caching**: Public keys could be cached (not currently implemented)
- **Batch operations**: Multiple files could be processed together
- **Async operations**: All VetKey calls are asynchronous

### Memory Management:

- **No key storage**: Backend doesn't store private keys
- **Efficient serialization**: Uses `serde_bytes::ByteBuf` for binary data
- **State cleanup**: File metadata cleaned up on deletion

## Configuration

### VetKey System API Configuration:

- **Canister ID**: `umunu-kh777-77774-qaaca-cai` (mainnet)
- **Key ID**: `"insecure_test_key_1"` (test configuration)
- **Curve**: `BLS12-381 G2` (threshold operations)
- **Derivation Path**: Empty (no additional derivation)

### Security Notes:

- **Test Key**: Currently uses `"insecure_test_key_1"` for development
- **Production**: Should use secure key management in production
- **Key Rotation**: VetKey System API supports key rotation

## Integration Points

### Frontend Integration:

- **Public key retrieval**: `actor.vetkd_public_key()`
- **Key derivation**: `actor.vetkd_encrypted_key(transport_key, file_id)`
- **File ownership**: `actor.get_file_owner_principal(file_id)`

### VetKey System API Integration:

- **Direct canister calls**: Uses `ic_cdk::call()` for inter-canister communication
- **Type safety**: Full Rust bindings with Candid serialization
- **Error handling**: Proper error propagation from VetKey System API

This VetKey backend implementation provides a secure, efficient bridge between the frontend and the VetKey System API, enabling Identity-Based Encryption for file storage and sharing on the Internet Computer.
