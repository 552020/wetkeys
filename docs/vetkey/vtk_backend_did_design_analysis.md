# VTK Backend Candid Interface (DID) Design Analysis

## Overview

This document provides a comprehensive design analysis for the VTK backend's Candid interface, incorporating lessons from the `canister_co` and `ic_vetkey_showcase` examples while adapting to VTK's specific file management and user system requirements.

## Current VTK State Analysis

### Existing Structure

Based on the current VTK implementation, we have:

#### **Core Data Types**

```rust
// File Management
pub struct FileMetadata {
    pub file_name: String,
    pub requester_principal: Principal,
    pub requested_at: u64,
    pub uploaded_at: Option<u64>,
    pub storage_provider: String, // "icp" or "walrus"
    pub blob_id: Option<String>,
}

// User Management
pub struct UserProfile {
    pub principal_id: Principal,
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub created_at: u64,
    pub last_login: u64,
    pub storage_used: u64,
    pub file_count: u64,
    pub is_active: bool,
}

// File Content with VetKey Integration
pub enum FileContent {
    Pending { alias: String },
    Uploaded {
        num_chunks: u64,
        file_type: String,
        vetkey_metadata: crate::vetkeys::EncryptedFileData,
    },
    PartiallyUploaded {
        num_chunks: u64,
        file_type: String,
        vetkey_metadata: crate::vetkeys::EncryptedFileData,
    },
}
```

#### **Current API Methods**

- File upload/download operations
- User profile management
- File listing and metadata
- Basic authentication via principal

## Proposed VetKey-Enhanced Candid Interface

### 1. **VetKey Infrastructure Types**

#### **VetKey Response Types**

```candid
type VetkdPublicKeyResponse = variant {
  Ok : blob;
  Err : text;
};

type VetkdEncryptedKeyResponse = variant {
  Ok : blob;
  Err : text;
};

type VetkdUserKeyResponse = variant {
  Ok : blob;
  Err : text;
};
```

**Design Rationale**:

- **Consistent Error Handling**: All VetKey operations use `Ok/Err` pattern
- **Binary Data**: Keys returned as blobs for efficient serialization
- **Descriptive Errors**: Text-based error messages for debugging

#### **VetKey Configuration Types**

```candid
type VetkdKeyId = record {
  name : text;
  curve : text; // "bls12_381_g2"
};

type VetkdDerivationPath = vec blob;

type VetkdContext = vec blob;
```

### 2. **Enhanced File Management Types**

#### **Updated File Metadata**

```candid
type FileMetadata = record {
  file_id : nat64;
  file_name : text;
  requester_principal : principal;
  requested_at : nat64;
  uploaded_at : opt nat64;
  storage_provider : text; // "icp" or "walrus"
  blob_id : opt text;
  is_encrypted : bool;
  encryption_type : text; // "vetkey" or "none"
  shared_with : vec principal;
  owner_principal : principal; // For shared files
};
```

**Key Enhancements**:

- **`is_encrypted`**: Flag for VetKey encryption status
- **`encryption_type`**: Distinguishes VetKey from other encryption
- **`shared_with`**: List of principals with access
- **`owner_principal`**: Original file owner for shared files

#### **File Sharing Types**

```candid
type FileSharingRequest = record {
  file_id : nat64;
  target_principal : principal;
  permissions : text; // "read", "write", "admin"
};

type FileSharingResponse = variant {
  Ok : text;
  Err : text;
};

type SharedFileInfo = record {
  file_id : nat64;
  file_name : text;
  owner_principal : principal;
  shared_at : nat64;
  permissions : text;
};
```

### 3. **User Management Enhancements**

#### **Enhanced User Profile**

```candid
type UserProfile = record {
  principal_id : principal;
  username : text;
  display_name : opt text;
  email : opt text;
  created_at : nat64;
  last_login : nat64;
  storage_used : nat64;
  file_count : nat64;
  is_active : bool;
  vetkey_enabled : bool;
  encryption_preferences : EncryptionPreferences;
};

type EncryptionPreferences = record {
  default_encryption : text; // "vetkey", "none"
  auto_encrypt_uploads : bool;
  require_encryption : bool;
};
```

### 4. **Complete Service Definition**

```candid
service vtk_backend : {
  // === VetKey Infrastructure ===
  get_root_public_key : () -> (VetkdPublicKeyResponse);
  get_user_key : (blob, text) -> (VetkdUserKeyResponse);
  vetkd_encrypted_key : (blob, opt nat64) -> (VetkdEncryptedKeyResponse);

  // === File Management ===
  register_file : (RegisterFileRequest) -> (RegisterFileResponse);
  upload_file_atomic : (UploadFileAtomicRequest) -> (variant { Ok : nat64; Err : text });
  upload_file_continue : (UploadFileContinueRequest) -> (variant { Ok : text; Err : text });
  download_file : (nat64, nat64) -> (FileDownloadResponse);
  delete_file : (nat64) -> (DeleteFileResult);
  list_files : () -> (vec PublicFileMetadata);

  // === File Sharing ===
  share_file : (FileSharingRequest) -> (FileSharingResponse);
  unshare_file : (nat64, principal) -> (FileSharingResponse);
  get_shared_files : () -> (vec SharedFileInfo);
  get_file_owner_principal : (nat64) -> (variant { Ok : blob; Err : text });

  // === User Management ===
  create_user_profile : (CreateUserRequest) -> (UserResponse);
  get_user_profile : () -> (UserResponse);
  update_user_profile : (UpdateUserRequest) -> (UserResponse);
  delete_user_profile : () -> (UserResponse);
  list_users : () -> (UserListResponse);
  get_user_stats : () -> (UserResponse);

  // === Utility Methods ===
  whoami : () -> (principal) query;
  get_time : () -> (nat64) query;
};
```

## Design Patterns from Examples

### 1. **Canister Co Patterns (File-Focused)**

#### **File Ownership Context**

```candid
// Adapted from canister_co
get_file_owner_principal : (nat64) -> (variant { Ok : blob; Err : text }) query;
get_shared_files : () -> (vec SharedFileInfo) query;
```

**VTK Adaptation**:

- **Principal-based ownership**: Uses VTK's existing principal system
- **File sharing support**: Extends VTK's file management
- **Owner principal retrieval**: Essential for shared file decryption

#### **VetKey Integration**

```candid
// Core VetKey methods from canister_co
vetkd_public_key : () -> (VetkdPublicKeyResponse);
vetkd_encrypted_key : (blob, opt nat64) -> (VetkdEncryptedKeyResponse);
```

**VTK Implementation**:

- **File ID context**: Optional file_id for shared file handling
- **Transport security**: Secure key exchange pattern
- **Identity-based encryption**: User principals as identities

### 2. **IC VetKey Showcase Patterns (User-Focused)**

#### **User Key Management**

```candid
// Adapted from ic_vetkey_showcase
get_user_key : (blob, text) -> (VetkdUserKeyResponse);
```

**VTK Adaptation**:

- **Username-based derivation**: Uses VTK's username system
- **Transport key security**: Secure key exchange
- **User-specific keys**: Personal VetKey for each user

#### **Encryption Preferences**

```candid
// Enhanced user preferences
type EncryptionPreferences = record {
  default_encryption : text;
  auto_encrypt_uploads : bool;
  require_encryption : bool;
};
```

**VTK Implementation**:

- **User control**: Users can choose encryption settings
- **Default behavior**: Configurable encryption defaults
- **Security levels**: Different encryption requirements

## VTK-Specific Design Decisions

### 1. **Hybrid Storage Support**

#### **Multi-Provider Architecture**

```candid
type FileMetadata = record {
  // ... other fields ...
  storage_provider : text; // "icp" or "walrus"
  blob_id : opt text;      // For Walrus storage
};
```

**Rationale**:

- **Flexibility**: Support both ICP and Walrus storage
- **VetKey compatibility**: Encryption works with any storage provider
- **User choice**: Users can select preferred storage

### 2. **Enhanced File Sharing**

#### **Permission-Based Sharing**

```candid
type FileSharingRequest = record {
  file_id : nat64;
  target_principal : principal;
  permissions : text; // "read", "write", "admin"
};
```

**VTK Features**:

- **Granular permissions**: Different access levels
- **Principal-based**: Uses VTK's principal system
- **VetKey integration**: Shared files use owner's principal for decryption

### 3. **User-Centric Design**

#### **Encryption Preferences**

```candid
type EncryptionPreferences = record {
  default_encryption : text;
  auto_encrypt_uploads : bool;
  require_encryption : bool;
};
```

**VTK Benefits**:

- **User control**: Individual encryption preferences
- **Default behavior**: Configurable system defaults
- **Security levels**: Different encryption requirements per user

## Security Architecture

### 1. **Zero-Knowledge Backend**

#### **Encrypted Storage**

- **No plaintext**: Backend never stores unencrypted data
- **VetKey metadata**: Only encrypted file metadata stored
- **Client-side crypto**: All encryption/decryption in frontend

### 2. **Principal-Based Access Control**

#### **Authentication**

```candid
// All methods verify caller principal
whoami : () -> (principal) query;
```

#### **Authorization**

- **File ownership**: Principal-based file access
- **Sharing permissions**: Granular access control
- **Anonymous blocking**: Reject anonymous principals

### 3. **Transport Security**

#### **Secure Key Exchange**

```candid
// Transport keys for secure communication
get_user_key : (blob, text) -> (VetkdUserKeyResponse);
vetkd_encrypted_key : (blob, opt nat64) -> (VetkdEncryptedKeyResponse);
```

## Implementation Strategy

### Phase 1: Core VetKey Integration

1. **Add VetKey response types**
2. **Implement core VetKey methods**
3. **Update file metadata structure**

### Phase 2: File Sharing Enhancement

1. **Add sharing types and methods**
2. **Implement permission system**
3. **Update file ownership logic**

### Phase 3: User Experience

1. **Add encryption preferences**
2. **Implement user key management**
3. **Add security settings**

### Phase 4: Advanced Features

1. **Multi-provider storage support**
2. **Advanced sharing permissions**
3. **Audit and logging**

## Comparison with Examples

### **Canister Co Similarities**

- ✅ File-focused VetKey integration
- ✅ Principal-based file ownership
- ✅ Transport security patterns
- ✅ File sharing capabilities

### **IC VetKey Showcase Similarities**

- ✅ User key management
- ✅ Encryption preferences
- ✅ Username-based operations
- ✅ Personal data encryption

### **VTK Unique Features**

- 🆕 Multi-provider storage support
- 🆕 Enhanced file sharing permissions
- 🆕 User encryption preferences
- 🆕 Hybrid storage architecture

## Conclusion

The proposed VTK Candid interface design successfully combines the best practices from both VetKey examples while adding VTK-specific features:

1. **Comprehensive VetKey Support**: Full integration with VetKey System API
2. **Enhanced File Management**: Advanced sharing and permissions
3. **User-Centric Design**: Individual encryption preferences
4. **Multi-Provider Architecture**: Support for ICP and Walrus storage
5. **Security-First Approach**: Zero-knowledge backend with principal-based access

This design provides a solid foundation for implementing VetKey encryption in the VTK system while maintaining compatibility with existing functionality and adding powerful new features for secure file management and sharing.
