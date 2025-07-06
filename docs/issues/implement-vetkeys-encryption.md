# Issue: Implement VetKey Encryption System

## Overview

Implement a comprehensive VetKey (Verifiable Threshold Key Derivation) encryption system for secure file storage and sharing in the VTK repository. This system will provide Identity-Based Encryption (IBE) capabilities, enabling secure file encryption using user principals as identities.

## Background

Based on analysis of VetKey examples from `canister_co` and `ic_vetkey_showcase`, we need to implement a file encryption system that:

- Encrypts files using user principals as identities
- Supports secure file sharing between users
- Provides transport security for key exchange
- Maintains zero-knowledge backend architecture

## Current State

The VTK repository currently has:

- Basic file upload/download functionality
- User management system
- Backend canister with file storage
- Frontend React application

**Missing**: VetKey encryption/decryption capabilities

## Implementation Plan

### Phase 1: Backend VetKey Infrastructure

#### 1.1 Add VetKey Dependencies

**File**: `src/vtk_backend/Cargo.toml`

```toml
[dependencies]
# Add VetKey system API integration
ic-cdk = "0.17.1"
ic-cdk-macros = "0.17.1"
candid = "0.10.12"
serde = "1.0.217"
serde_bytes = "0.11.15"
```

#### 1.2 Create VetKey System API Declarations

**File**: `src/vtk_backend/src/declarations/vetkd_system_api.rs`

- Add complete Rust bindings for VetKey System API canister
- Define data structures for public key and encrypted key operations
- Implement client for inter-canister communication

#### 1.3 Implement VetKey Module Structure

**Directory**: `src/vtk_backend/src/vetkd/`

```
vetkd/
├── mod.rs                    # Module declaration
└── controller/
    ├── mod.rs               # Controller module declaration
    ├── vetkd_public_key.rs  # Public key retrieval
    └── vetkd_encrypted_key.rs # Encrypted key derivation
```

#### 1.4 Add VetKey API Endpoints

**Files**:

- `src/vtk_backend/src/vetkd/controller/vetkd_public_key.rs`
- `src/vtk_backend/src/vetkd/controller/vetkd_encrypted_key.rs`

**Endpoints**:

- `vetkd_public_key()`: Returns public key for encryption
- `vetkd_encrypted_key(encryption_public_key, file_id)`: Returns encrypted decryption key
- `get_file_owner_principal(file_id)`: Returns file owner's principal for shared files

#### 1.5 Update Candid Interface

**File**: `src/vtk_backend/service.did`

```candid
type VetkdEncryptedKeyResponse = variant {
  Ok : blob;
  Err : text;
};

type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};

service vtk_backend : {
  // ... existing methods ...
  vetkd_encrypted_key : (blob, opt nat64) -> (VetkdEncryptedKeyResponse);
  vetkd_public_key : () -> (VetkdPublicKeyResponse);
  get_file_owner_principal : (nat64) -> (variant { Ok : blob; Err : text });
};
```

### Phase 2: Frontend VetKey Integration

#### 2.1 Add VetKey Dependencies

**File**: `src/vtk_frontend/package.json`

```json
{
  "dependencies": {
    "@dfinity/agent": "^2.3.0",
    "@dfinity/auth-client": "^2.2.0",
    "@dfinity/principal": "^2.3.0",
    "@dfinity/candid": "^2.3.0",
    "ic-vetkd-utils": "file:./ic-vetkd-utils-0.1.0.tgz"
  }
}
```

#### 2.2 Create VetKey Crypto Service

**File**: `src/vtk_frontend/src/services/vetkdCrypto.ts`

```typescript
import * as vetkd from "ic-vetkd-utils";
import type { ActorType } from "../types/actor";

export class VetkdCryptoService {
  constructor(private actor: ActorType) {}

  async encrypt(data: ArrayBuffer, userPrincipalBytes: Uint8Array): Promise<Uint8Array>;
  async decrypt(encryptedData: Uint8Array, userPrincipalBytes: Uint8Array, fileId: bigint): Promise<Uint8Array>;
}
```

#### 2.3 Update File Upload Service

**File**: `src/vtk_frontend/src/services/fileService.ts`

- Integrate VetKey encryption in upload process
- Add encryption step before file upload
- Handle user principal retrieval

#### 2.4 Update File Download Service

**File**: `src/vtk_frontend/src/services/fileService.ts`

- Integrate VetKey decryption in download process
- Add decryption step after file download
- Handle shared file principal determination

#### 2.5 Add VetKey System API Declarations

**Directory**: `src/vtk_frontend/src/declarations/vetkd_system_api/`

- Add TypeScript declarations for VetKey System API
- Define interfaces for public key and encrypted key operations

### Phase 3: File Management Integration

#### 3.1 Update File Metadata Structure

**File**: `src/vtk_backend/src/memory.rs`

```rust
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct FileMetadata {
    pub file_name: String,
    pub user_public_key: Vec<u8>,
    pub requester_principal: Principal,  // File owner's principal
    pub requested_at: u64,
    pub uploaded_at: Option<u64>,
    pub is_encrypted: bool,              // New field
}
```

#### 3.2 Update File Upload API

**File**: `src/vtk_backend/src/api/upload_file_atomic.rs`

- Store encrypted file data instead of plaintext
- Update metadata to include encryption information
- Maintain file ownership tracking

#### 3.3 Update File Download API

**File**: `src/vtk_backend/src/api/download_file.rs`

- Return encrypted file data
- Include file metadata for decryption
- Support shared file access

#### 3.4 Add File Sharing Support

**Files**:

- `src/vtk_backend/src/api/share_file.rs` (new)
- `src/vtk_frontend/src/services/shareService.ts` (new)

### Phase 4: Security and Access Control

#### 4.1 Implement Principal-Based Access Control

- Verify caller principal for all operations
- Block anonymous principals for sensitive operations
- Maintain file ownership integrity

#### 4.2 Add Transport Security

- Implement secure key transport using VetKey transport keys
- Prevent key interception during transmission
- Use cryptographically secure random generation

#### 4.3 Add Error Handling

- Handle VetKey API failures gracefully
- Provide detailed error messages for debugging
- Implement fallback mechanisms

### Phase 5: Testing and Validation

#### 5.1 Unit Tests

**Directory**: `src/vtk_backend/tests/`

- Test VetKey public key retrieval
- Test encrypted key derivation
- Test file encryption/decryption flows

#### 5.2 Integration Tests

**Directory**: `src/vtk_frontend/src/tests/`

- Test complete file upload/download with encryption
- Test file sharing functionality
- Test error scenarios

#### 5.3 Security Tests

- Verify zero-knowledge backend architecture
- Test principal-based access control
- Validate transport security

## Technical Requirements

### Backend Requirements

- Internet Computer canister with VetKey System API integration
- Rust implementation with proper error handling
- Candid interface for frontend communication
- State management for file metadata

### Frontend Requirements

- React application with VetKey utils integration
- TypeScript for type safety
- Secure key management and transport
- User-friendly encryption/decryption flows

### Security Requirements

- Zero-knowledge backend (no plaintext data storage)
- Principal-based access control
- Secure key transport
- Cryptographically secure random generation

## Dependencies

### External Dependencies

- VetKey System API canister (`umunu-kh777-77774-qaaca-cai`)
- `ic-vetkd-utils` library for frontend
- DFINITY agent libraries

### Internal Dependencies

- Existing file management system
- User management system
- Backend canister infrastructure

## Success Criteria

### Functional Requirements

- [ ] Files are encrypted using user principals as identities
- [ ] Encrypted files can be decrypted by authorized users
- [ ] File sharing works with proper access control
- [ ] Transport security prevents key interception
- [ ] Backend never stores plaintext data

### Performance Requirements

- [ ] Encryption/decryption completes within reasonable time
- [ ] File upload/download performance is maintained
- [ ] Memory usage is optimized for large files
- [ ] Concurrent operations are supported

### Security Requirements

- [ ] Zero-knowledge backend architecture
- [ ] Principal-based access control
- [ ] Secure key transport
- [ ] No key storage in backend

## Risks and Mitigation

### Technical Risks

1. **VetKey API Integration Complexity**

   - Mitigation: Follow established patterns from examples
   - Fallback: Implement gradual rollout with feature flags

2. **Performance Impact**

   - Mitigation: Implement chunked processing for large files
   - Fallback: Provide encryption toggle for performance-critical use cases

3. **Key Management Complexity**
   - Mitigation: Use established VetKey patterns
   - Fallback: Implement comprehensive error handling

### Security Risks

1. **Key Exposure**

   - Mitigation: Implement secure transport and zero-knowledge backend
   - Fallback: Regular security audits

2. **Access Control Bypass**
   - Mitigation: Implement strict principal verification
   - Fallback: Comprehensive testing and validation

## Timeline

### Phase 1: Backend Infrastructure (Week 1-2)

- VetKey dependencies and declarations
- Core VetKey module implementation
- API endpoint development

### Phase 2: Frontend Integration (Week 3-4)

- VetKey crypto service implementation
- File service integration
- User interface updates

### Phase 3: File Management (Week 5-6)

- File metadata updates
- Upload/download integration
- Sharing functionality

### Phase 4: Security (Week 7)

- Access control implementation
- Transport security
- Error handling

### Phase 5: Testing (Week 8)

- Unit and integration tests
- Security validation
- Performance testing

## Resources

### Documentation

- [VetKey System API Documentation](https://internetcomputer.org/docs/current/developer-docs/integrations/vetkey/)
- [Canister Co Example Analysis](./vetkey/examples/canister_co/)
- [IC VetKey Showcase Example Analysis](./vetkey/examples/ic_vetkey_showcase/)

### Code Examples

- VetKey crypto service patterns
- File encryption/decryption flows
- Transport security implementation

## Next Steps

1. **Review and approve implementation plan**
2. **Set up development environment with VetKey dependencies**
3. **Begin Phase 1: Backend VetKey infrastructure**
4. **Create feature branch for development**
5. **Implement core VetKey module structure**

---

**Priority**: High  
**Estimated Effort**: 8 weeks  
**Assigned To**: TBD  
**Reviewers**: TBD
