# Backend VetKey API Analysis

## Overview

This document provides a comprehensive analysis of the backend API regarding VetKey methods as defined in the Candid interface file (`backend/service.did`). The backend exposes VetKey functionality through a clean, type-safe API that bridges the frontend with the VetKey System API.

## VetKey-Specific Types

### 1. VetKey Response Types

#### `VetkdPublicKeyResponse`

```candid
type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};
```

**Purpose**: Response type for public key retrieval operations.

**Fields**:

- `Ok : blob` - The public key as a binary blob (BLS12-381 G2 public key)
- `Err : text` - Error message if public key retrieval fails

**Usage**: Returned by `vetkd_public_key()` method.

#### `VetkdEncryptedKeyResponse`

```candid
type VetkdEncryptedKeyResponse = variant {
  Ok : blob;
  Err : text;
};
```

**Purpose**: Response type for encrypted key derivation operations.

**Fields**:

- `Ok : blob` - The encrypted decryption key as a binary blob
- `Err : text` - Error message if key derivation fails

**Usage**: Returned by `vetkd_encrypted_key()` method.

## VetKey API Methods

### 1. Public Key Retrieval

#### `vetkd_public_key()`

```candid
vetkd_public_key : () -> (VetkdPublicKeyResponse);
```

**Purpose**: Retrieves the public key from the VetKey System API for encryption operations.

**Parameters**: None

**Returns**: `VetkdPublicKeyResponse`

**Behavior**:

- Calls the VetKey System API to retrieve the public key
- Uses test key configuration (`"insecure_test_key_1"`)
- Returns the public key as a binary blob for IBE encryption
- Returns error message if VetKey System API is unavailable

**Frontend Usage**:

```typescript
const publicKeyResponse = await actor.vetkd_public_key();
if ("Ok" in publicKeyResponse) {
  const publicKey = publicKeyResponse.Ok as Uint8Array;
  // Use for encryption
}
```

### 2. Encrypted Key Derivation

#### `vetkd_encrypted_key()`

```candid
vetkd_encrypted_key : (blob, opt nat64) -> (VetkdEncryptedKeyResponse);
```

**Purpose**: Derives an encrypted decryption key for a specific identity (user principal).

**Parameters**:

- `blob` - Transport public key from frontend for secure key exchange
- `opt nat64` - Optional file ID to determine ownership context

**Returns**: `VetkdEncryptedKeyResponse`

**Behavior**:

- **Own files**: Uses caller's principal as derivation ID
- **Shared files**: Uses file owner's principal as derivation ID (when file_id provided)
- Calls VetKey System API for key derivation
- Returns encrypted key for frontend decryption
- Returns error message if derivation fails

**Frontend Usage**:

```typescript
const encryptedKeyResponse = await actor.vetkd_encrypted_key(transportPublicKey, fileId ? [fileId] : []);
if ("Ok" in encryptedKeyResponse) {
  const encryptedKey = encryptedKeyResponse.Ok as Uint8Array;
  // Use for decryption
}
```

## Supporting Types for VetKey Operations

### File Ownership Context

#### `file_metadata`

```candid
type file_metadata = record {
  file_id : file_id;
  file_name : text;
  group_name : text;
  group_alias : opt text;
  file_status : file_status;
  shared_with : vec user;
};
```

**Purpose**: Contains file metadata including ownership information.

**VetKey Relevance**: Used to determine file ownership for key derivation.

#### `user`

```candid
type user = record {
  username : text;
  public_key : blob;
  ic_principal : principal;
};
```

**Purpose**: User information including principal for identity-based operations.

**VetKey Relevance**: The `ic_principal` field is used as the identity for VetKey operations.

### File Owner Principal Query

#### `get_file_owner_principal()`

```candid
get_file_owner_principal : (file_id : nat64) -> (variant { Ok : blob; Err : text }) query;
```

**Purpose**: Retrieves the original owner's principal for a specific file.

**Parameters**:

- `file_id : nat64` - The file ID to look up

**Returns**: `variant { Ok : blob; Err : text }`

**Behavior**:

- Looks up file metadata in state
- Returns owner's principal as binary blob
- Returns error if file not found

**VetKey Relevance**: Used by frontend to determine correct principal for shared file decryption.

**Frontend Usage**:

```typescript
const ownerPrincipalResponse = await actor.get_file_owner_principal(fileId);
if ("Ok" in ownerPrincipalResponse) {
  const ownerPrincipal = new Uint8Array(ownerPrincipalResponse.Ok);
  // Use owner's principal for decryption
}
```

## File Sharing Context

### Shared Files Query

#### `get_shared_files()`

```candid
get_shared_files : () -> (vec file_metadata) query;
```

**Purpose**: Returns list of files shared with the caller.

**Returns**: `vec file_metadata`

**VetKey Relevance**: Used by frontend to determine if a file is shared and needs owner principal for decryption.

**Frontend Usage**:

```typescript
const sharedFiles = await actor.get_shared_files();
const isSharedFile = sharedFiles.some((file) => file.file_id === fileId);
```

## Complete VetKey API Flow

### Encryption Flow

1. **Frontend calls** `vetkd_public_key()`
2. **Backend calls** VetKey System API for public key
3. **Frontend receives** public key for IBE encryption
4. **Frontend encrypts** file using user's principal as identity
5. **Frontend uploads** encrypted file to backend

### Decryption Flow

1. **Frontend calls** `get_shared_files()` to check ownership
2. **Frontend calls** `get_file_owner_principal(fileId)` if shared
3. **Frontend calls** `vetkd_encrypted_key(transportKey, fileId)`
4. **Backend determines** correct principal (owner vs caller)
5. **Backend calls** VetKey System API for key derivation
6. **Frontend receives** encrypted key for decryption
7. **Frontend decrypts** file using derived key

## Error Handling

### Common Error Scenarios

#### Public Key Retrieval Errors

- **VetKey System API unavailable**: Network or service issues
- **Invalid key configuration**: Test key not properly configured
- **Permission errors**: Canister not authorized for VetKey operations

#### Key Derivation Errors

- **File not found**: Invalid file ID provided
- **Permission errors**: Caller not authorized for file
- **VetKey System API errors**: Key derivation service issues
- **Invalid principal**: Malformed principal data

#### File Owner Lookup Errors

- **File not found**: File ID doesn't exist in state
- **State corruption**: File metadata is invalid

### Error Response Format

```candid
// All VetKey methods return structured error responses
type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};

type VetkdEncryptedKeyResponse = variant {
  Ok : blob;
  Err : text;
};
```

## Security Considerations

### Identity-Based Encryption

- **Principal as Identity**: User principals serve as identities for IBE
- **File Ownership**: File owner's principal used for shared files
- **Access Control**: Only authorized principals can derive decryption keys

### Transport Security

- **Transport Keys**: Secure key exchange using transport public keys
- **No Key Storage**: Backend never stores private keys
- **On-Demand Derivation**: Keys derived only when needed

### Authentication Requirements

- **Caller Verification**: All VetKey methods verify caller's principal
- **Anonymous Blocking**: Anonymous principals rejected
- **File Access Control**: File ownership determines access rights

## API Design Patterns

### Consistent Response Format

- **Result Types**: All VetKey methods use `Ok/Err` variant responses
- **Binary Data**: Keys and principals returned as binary blobs
- **Error Messages**: Descriptive error text for debugging

### Optional Parameters

- **File ID**: Optional parameter for context-aware key derivation
- **Flexible Usage**: Supports both own files and shared files

### Query vs Update Methods

- **Query Methods**: `get_file_owner_principal()`, `get_shared_files()` (read-only)
- **Update Methods**: `vetkd_public_key()`, `vetkd_encrypted_key()` (state-changing)

## Integration Points

### Frontend Integration

- **TypeScript Bindings**: Generated from Candid interface
- **Actor Methods**: Direct method calls on backend actor
- **Error Handling**: Structured error responses for UI feedback

### VetKey System API Integration

- **Inter-Canister Calls**: Backend calls VetKey System API
- **Type Safety**: Full Rust bindings with Candid serialization
- **Async Operations**: All VetKey operations are asynchronous

### State Integration

- **File Metadata**: VetKey operations integrated with file management
- **User Management**: Principal tracking for identity-based operations
- **Sharing System**: File sharing integrated with key derivation

This VetKey API provides a clean, secure, and efficient interface for Identity-Based Encryption operations, seamlessly integrating with the file storage and sharing system.
