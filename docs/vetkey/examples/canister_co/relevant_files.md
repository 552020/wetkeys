# VetKey Relevant Files

This document lists all VetKey-related files in the repository, organized by category and purpose.

## Frontend VetKey Files

### Core VetKey Service

- **`frontend/src/frontend/src/lib/vetkeys/vetkdCrypto.ts`**
  - **Purpose**: Main VetKey encryption/decryption service
  - **Description**: Contains the `VetkdCryptoService` class with `encrypt()` and `decrypt()` methods
  - **Key Functions**: IBE encryption, key derivation, transport security

### VetKey Library

- **`frontend/ic-vetkd-utils-0.1.0.tgz`**
  - **Purpose**: VetKey utilities library package
  - **Description**: Local package containing VetKey cryptographic functions
  - **Usage**: Imported as `ic-vetkd-utils` in the frontend

### Frontend Service Integration

- **`frontend/src/frontend/src/lib/services/upload.ts`**

  - **Purpose**: File upload service with VetKey integration
  - **Description**: Uses `VetkdCryptoService` for file encryption before upload
  - **Key Integration**: Line 85-96 calls `vetkdCryptoService.encrypt()`

- **`frontend/src/frontend/src/lib/services/decrypt.ts`**
  - **Purpose**: File decryption service with VetKey integration
  - **Description**: Uses `VetkdCryptoService` for file decryption after download
  - **Key Integration**: Line 130-135 calls `vetkdCryptoService.decrypt()`

### Test Components

- **`frontend/src/frontend/src/lib/components/Test/TestEncryptedUpload.svelte`**
  - **Purpose**: Test component for VetKey encryption/decryption
  - **Description**: Manual VetKey operations for testing and debugging
  - **Key Features**: Direct VetKey calls, encryption/decryption testing

### Frontend Declarations

- **`frontend/src/declarations/backend/backend.did.d.ts`**

  - **Purpose**: TypeScript declarations for backend VetKey methods
  - **Description**: Contains `VetkdPublicKeyResponse` and `VetkdEncryptedKeyResponse` types
  - **Key Methods**: `vetkd_public_key` and `vetkd_encrypted_key` actor methods

- **`frontend/src/declarations/backend/backend.did.js`**

  - **Purpose**: JavaScript bindings for backend VetKey methods
  - **Description**: Generated bindings for VetKey API calls
  - **Key Methods**: VetKey method implementations for frontend-backend communication

- **`frontend/src/declarations/vetkd_system_api/vetkd_system_api.did.d.ts`**

  - **Purpose**: TypeScript declarations for VetKey System API
  - **Description**: Complete type definitions for VetKey System API canister
  - **Key Types**: `vetkd_public_key_args`, `vetkd_derive_encrypted_key_args`, etc.

- **`frontend/src/declarations/vetkd_system_api/vetkd_system_api.did.js`**

  - **Purpose**: JavaScript bindings for VetKey System API
  - **Description**: Generated bindings for direct VetKey System API calls
  - **Key Methods**: `vetkd_public_key`, `vetkd_derive_encrypted_key`

- **`frontend/src/declarations/vetkd_system_api/index.d.ts`**

  - **Purpose**: TypeScript interface for VetKey System API actor
  - **Description**: Actor creation and configuration types
  - **Key Features**: Actor factory and configuration options

- **`frontend/src/declarations/vetkd_system_api/index.js`**
  - **Purpose**: JavaScript actor factory for VetKey System API
  - **Description**: Creates and configures VetKey System API actors
  - **Key Features**: Actor creation with proper agent configuration

## Backend VetKey Files

### Core VetKey Module

- **`backend/src/vetkd/mod.rs`**

  - **Purpose**: VetKey module declaration
  - **Description**: Exports the VetKey controller module
  - **Content**: `pub mod controller;`

- **`backend/src/vetkd/controller/mod.rs`**
  - **Purpose**: VetKey controller module declaration
  - **Description**: Exports VetKey public key and encrypted key modules
  - **Content**: `pub mod vetkd_public_key;` and `pub mod vetkd_encrypted_key;`

### VetKey Operations

- **`backend/src/vetkd/controller/vetkd_public_key.rs`**

  - **Purpose**: Public key retrieval from VetKey System API
  - **Description**: Implements `vetkd_public_key()` update method
  - **Key Features**: Calls VetKey System API for public key retrieval

- **`backend/src/vetkd/controller/vetkd_encrypted_key.rs`**
  - **Purpose**: Encrypted key derivation from VetKey System API
  - **Description**: Implements `vetkd_encrypted_key()` update method
  - **Key Features**: File ownership-aware key derivation

### Backend Declarations

- **`backend/src/declarations/vetkd_system_api.rs`**

  - **Purpose**: Rust bindings for VetKey System API
  - **Description**: Complete Rust types and client for VetKey System API
  - **Key Features**: `VetkdSystemApi` struct with async methods

- **`backend/src/declarations/vetkd_system_api/vetkd_system_api.did`**

  - **Purpose**: Candid interface definition for VetKey System API
  - **Description**: Service definition with VetKey methods
  - **Key Methods**: `vetkd_public_key`, `vetkd_derive_encrypted_key`

- **`backend/src/declarations/vetkd_system_api/vetkd_system_api.did.d.ts`**

  - **Purpose**: TypeScript declarations for VetKey System API
  - **Description**: Type definitions for VetKey System API interface
  - **Key Types**: VetKey argument and result types

- **`backend/src/declarations/vetkd_system_api/vetkd_system_api.did.js`**

  - **Purpose**: JavaScript bindings for VetKey System API
  - **Description**: Generated JavaScript interface for VetKey System API
  - **Key Features**: IDL factory and method implementations

- **`backend/src/declarations/vetkd_system_api/index.d.ts`**

  - **Purpose**: TypeScript interface for VetKey System API actor
  - **Description**: Actor creation and configuration types
  - **Key Features**: Actor factory and configuration options

- **`backend/src/declarations/vetkd_system_api/index.js`**
  - **Purpose**: JavaScript actor factory for VetKey System API
  - **Description**: Creates and configures VetKey System API actors
  - **Key Features**: Actor creation with proper agent configuration

### Backend Integration

- **`backend/src/lib.rs`**

  - **Purpose**: Main library file with VetKey module integration
  - **Description**: Exports VetKey module and contains file metadata structures
  - **Key Integration**: `pub mod vetkd;` and `FileMetadata` with principal tracking

- **`backend/src/main.rs`**

  - **Purpose**: Main canister entry point with VetKey method exposure
  - **Description**: Contains VetKey method declarations and file owner principal query
  - **Key Methods**: `get_file_owner_principal()` and VetKey method imports

- **`backend/service.did`**
  - **Purpose**: Candid interface for the backend canister
  - **Description**: Exposes VetKey methods to frontend
  - **Key Methods**: `vetkd_public_key()` and `vetkd_encrypted_key()`

## Configuration Files

### DFX Configuration

- **`dfx.json`**
  - **Purpose**: DFX project configuration with VetKey System API integration
  - **Description**: Configures VetKey System API canister and frontend dependencies
  - **Key VetKey Configuration**:
    - `vetkd_system_api` canister with local testing setup
    - Frontend dependency on `vetkd_system_api`
    - Declaration output to `src/declarations/vetkd_system_api`
    - Uses local testing canister (`chainkey_testing_canister.wasm`)

### Package Configuration

- **`frontend/package.json`**

  - **Purpose**: Frontend dependencies including VetKey library
  - **Description**: Contains `ic-vetkd-utils` dependency
  - **Key Dependencies**: VetKey utilities and DFINITY libraries

- **`backend/Cargo.toml`**
  - **Purpose**: Backend dependencies for VetKey integration
  - **Description**: Contains IC CDK and serialization dependencies
  - **Key Dependencies**: `ic-cdk`, `candid`, `serde`, `serde_bytes`

## Build and Generation Files

### Build Configuration

- **`backend/build.rs`**
  - **Purpose**: Build script for backend
  - **Description**: Handles Candid generation and build configuration
  - **Key Features**: Candid interface generation

## Summary by Category

### Core Implementation Files (8 files)

1. `frontend/src/frontend/src/lib/vetkeys/vetkdCrypto.ts`
2. `backend/src/vetkd/controller/vetkd_public_key.rs`
3. `backend/src/vetkd/controller/vetkd_encrypted_key.rs`
4. `frontend/src/frontend/src/lib/services/upload.ts`
5. `frontend/src/frontend/src/lib/services/decrypt.ts`
6. `frontend/src/frontend/src/lib/components/Test/TestEncryptedUpload.svelte`
7. `backend/src/lib.rs`
8. `backend/src/main.rs`

### Declaration and Binding Files (12 files)

1. `frontend/src/declarations/backend/backend.did.d.ts`
2. `frontend/src/declarations/backend/backend.did.js`
3. `frontend/src/declarations/vetkd_system_api/vetkd_system_api.did.d.ts`
4. `frontend/src/declarations/vetkd_system_api/vetkd_system_api.did.js`
5. `frontend/src/declarations/vetkd_system_api/index.d.ts`
6. `frontend/src/declarations/vetkd_system_api/index.js`
7. `backend/src/declarations/vetkd_system_api.rs`
8. `backend/src/declarations/vetkd_system_api/vetkd_system_api.did`
9. `backend/src/declarations/vetkd_system_api/vetkd_system_api.did.d.ts`
10. `backend/src/declarations/vetkd_system_api/vetkd_system_api.did.js`
11. `backend/src/declarations/vetkd_system_api/index.d.ts`
12. `backend/src/declarations/vetkd_system_api/index.js`

### Module Structure Files (3 files)

1. `backend/src/vetkd/mod.rs`
2. `backend/src/vetkd/controller/mod.rs`
3. `backend/service.did`

### Library and Configuration Files (5 files)

1. `frontend/ic-vetkd-utils-0.1.0.tgz`
2. `frontend/package.json`
3. `backend/Cargo.toml`
4. `backend/build.rs`
5. `dfx.json`

## Total: 28 VetKey-Related Files

This comprehensive list covers all files that are directly involved in VetKey functionality, from core implementation to supporting declarations and configuration files.
