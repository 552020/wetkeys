# File Types and Upload/Download Overview

This document covers the main types and flows related to file management, upload, and download in the system. It explains key backend data structures, upload/download requests and responses, and frontend handling of chunked uploads.

## 1. Core Type Definitions

### file_id
Unique identifier for each file.

```rust
type file_id = nat64;
pub type FileId = u64;
```

### file_status
Represents the upload state of a file.

```rust
type file_status = variant {
  pending : record { alias : text; requested_at : nat64 };
  partially_uploaded;
  uploaded : record { uploaded_at : nat64 };
};

pub enum FileStatus {
    Pending { alias: String, requested_at: u64 },
    PartiallyUploaded,
    Uploaded { uploaded_at: u64 },
}
```

### file_metadata
Metadata describing each file.

```rust
type file_metadata = record {
  file_id : file_id;
  file_name : text;
  file_status : file_status;
  shared_with : vec user;
};

pub struct FileMetadata {
    pub file_name: String,
    pub requester_principal: Principal,
    pub requested_at: u64,
    pub uploaded_at: Option<u64>,
    pub storage_provider: String, // "icp" or "walrus"
    pub blob_id: Option<String>,  // Only for Walrus files
}
```

### file
Full file object including optional content.

```rust
type file = record {
  metadata : file_metadata;
  contents : opt blob;
};

pub struct File {
    pub metadata: FileMetadata,
    pub content: FileContent,
}
```

## 2. Backend Data Structures

### File Content States
Files can be in one of these content states, used internally to track upload progress:

```rust
pub enum FileContent {
    Pending {
        alias: String,
    },
    Uploaded {
        num_chunks: u64,
        file_type: String,
        owner_key: Vec<u8>,
    },
    PartiallyUploaded {
        num_chunks: u64,
        file_type: String,
        owner_key: Vec<u8>, // VetKD public key
    },
}
```

## 3. Upload and Download Request/Response Types

### found_file
Used in download responses to carry actual file data.

```rust
type found_file = record {
  contents : blob;
  file_type : text;
  num_chunks : nat64;
};
```

### upload_file_request
For uploading file chunks (non-atomic).

```rust
type upload_file_request = record {
  name : text;
  content : blob;
  file_type : text;
  num_chunks : nat64;
};
```

### upload_file_atomic_request
For atomic (single-step) uploads.

```rust
type upload_file_atomic_request = record {
  name : text;
  content : blob;
  file_type : text;
  num_chunks : nat64;
};
```

### upload_file_continue_request
For subsequent chunks in multi-step upload.

```rust
type upload_file_continue_request = record {
  file_id : file_id;
  file_content : blob;
  file_type : text;
  num_chunks : nat64;
};
```

### download_file_response
Response for file downloads.

```rust
type download_file_response = variant {
  not_found_file;
  not_uploaded_file;
  permission_error;
  found_file : file_data;
};
```

### upload_file_response and upload_file_error
Upload result status.

```rust
type upload_file_response = variant {
  Ok;
  Err : error_with_file_upload;
};

type error_with_file_upload = variant {
  already_uploaded;
  not_requested;
};
```

## 4. Chunk Size Configuration

```javascript
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
```

Files are chunked into 2 MB parts for upload.

## 5. Upload Flow

### Phase 1: Atomic Upload (First Chunk)
- The first chunk is uploaded using `upload_file_atomic()`
- This creates the file record and stores chunk 0
- File status becomes **PartiallyUploaded** if multiple chunks are expected

### Phase 2: Continue Upload (Subsequent Chunks)
- Remaining chunks use `upload_file_continue()`
- Each chunk is stored with the file_id and chunk data
- File status transitions to **Uploaded** when all chunks are received

## 6. Frontend Implementation

- The frontend manages chunked uploads within the **FileUpload** component
- It handles splitting files into 2MB chunks, sending the first chunk atomically, then continuing with chunked uploads
- Upload progress percentage is tracked and displayed
- Errors during upload are handled gracefully with proper user feedback

## 7. Key Features

- **Authentication Required:** Only authenticated users can upload files
- **Ownership Tracking:** Files are associated with user principals
- **Progress Tracking:** Frontend shows real-time upload progress
- **Error Handling:** Comprehensive error states cover failed uploads
- **Dual Storage:** Supports ICP chunked storage and Walrus single-blob storage
- **Stable Memory:** File chunks stored in stable memory ensuring persistence across upgrades

## 8. File Size Limits and Upload Logic

- Maximum allowed upload size is 100 MiB
- Files ≤ 2 MiB: Uploaded in a single atomic request
- Files > 2 MiB and ≤ 100 MiB: First chunk uploaded atomically, subsequent chunks via chunked upload
- Files > 100 MiB: Upload blocked by frontend

## Summary Table of Types

| Type | Purpose | Key Fields/Variants |
|------|---------|-------------------|
| file_id | Unique file identifier | nat64/u64 |
| file_status | Upload lifecycle state | pending, partially_uploaded, uploaded |
| file_metadata | File metadata | file_name, requester_principal, storage_provider, blob_id |
| file | Full file object | metadata, FileContent |
| FileContent (Rust enum) | Tracks upload progress state | Pending, PartiallyUploaded, Uploaded (with owner_key) |
| upload_file_atomic_request | Upload first chunk atomically | name, content, file_type, num_chunks |
| upload_file_continue_request | Upload subsequent chunks | file_id, file_content, file_type, num_chunks |
| upload_file_request | Upload chunk (non-atomic) | name, content, file_type, num_chunks |
| download_file_response | Download response with file data or errors | variants for not_found, permission_error, file_data |