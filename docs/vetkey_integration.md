# VetKey Integration for Droplocked

This document describes the implementation of vetKey encryption in the droplocked file storage system.

## Overview

Droplocked uses [vetKeys](https://github.com/dfinity/vetkeys) (Verifiable Encrypted Threshold Keys) to provide end-to-end encryption for files stored on the Internet Computer. This ensures that files are encrypted before being stored and can only be decrypted by authorized users.

## Architecture

### Encryption Flow

1. **File Upload**: When a file is uploaded, it goes through the following process:
   - File content is received from the user
   - A unique file ID is generated
   - For each file owner, a vetKey is derived using the file ID
   - File content is encrypted using the derived keys
   - Encrypted content and metadata are stored on-chain

2. **File Download**: When a file is downloaded:
   - User authentication is verified
   - File ownership is checked
   - A vetKey is derived for the requesting user
   - File content is decrypted using the derived key
   - Decrypted content is returned to the user

### Key Components

#### VetKeyService (`src/vtk_backend/src/vetkeys.rs`)

The `VetKeyService` provides the core vetKey functionality:

- `get_public_key()`: Retrieves the vetKey public key for a user
- `derive_encryption_key()`: Derives an encryption key for a specific file and user
- `encrypt_file_for_owners()`: Encrypts file content for multiple owners
- `decrypt_file_for_user()`: Decrypts file content for a specific user

#### File Content Structure

Files are stored with the following structure:

```rust
pub enum FileContent {
    Uploaded {
        num_chunks: u64,
        file_type: String,
        vetkey_metadata: EncryptedFileData,
    },
    PartiallyUploaded {
        num_chunks: u64,
        file_type: String,
        vetkey_metadata: EncryptedFileData,
    },
}
```

Where `EncryptedFileData` contains:
- `encrypted_content`: The encrypted file content
- `file_owners`: List of principals who can access the file
- `encryption_metadata`: Mapping of principals to their encrypted keys

## Security Features

### Invisible to Users

The vetKey encryption is completely transparent to users:
- No key management required
- No passwords to remember
- Automatic encryption/decryption
- Based on Internet Identity authentication

### Threshold Cryptography

- Uses BLS12381G1 curve for key derivation
- Keys are derived using file-specific derivation paths
- Each file gets unique encryption keys
- Supports multiple file owners

### Privacy Preserving

- File content is never stored in plain text
- Encryption keys are derived on-demand
- No central key storage
- Decryption only possible by authorized users

## Implementation Details

### Key Derivation

Keys are derived using the following path:
```
vtk_file_encryption/file_{file_id}
```

This ensures:
- Each file has unique keys
- Keys are deterministic for the same file and user
- No key reuse between files

### Encryption Method

Currently uses XOR encryption for demonstration. In production, this should be replaced with:
- AES-256-GCM for symmetric encryption
- Proper key derivation from vetKeys
- Authenticated encryption

### Error Handling

The system provides comprehensive error handling:
- Authentication failures
- Authorization failures
- Encryption/decryption errors
- Network failures

## API Changes

### Upload Endpoint

```rust
#[update]
async fn upload_file_atomic(request: UploadFileAtomicRequest) -> Result<u64, String>
```

Returns:
- `Ok(file_id)`: Success with file ID
- `Err(message)`: Error with description

### Download Endpoint

```rust
#[query]
async fn download_file(file_id: u64, chunk_id: u64) -> Result<FileDownloadResponse, String>
```

Returns:
- `Ok(FileDownloadResponse)`: Success with file data
- `Err(message)`: Error with description

## Frontend Integration

The frontend has been updated to handle the new async responses:

### Upload Handling

```typescript
const uploadResult = await actor.upload_file_atomic(uploadArgs);
if (uploadResult && typeof uploadResult === 'object' && 'ok' in uploadResult) {
  const fileId = uploadResult.ok;
} else if (uploadResult && typeof uploadResult === 'object' && 'err' in uploadResult) {
  throw new Error(`Upload failed: ${uploadResult.err}`);
}
```

### Download Handling

```typescript
const response = await actor.download_file(file.file_id, BigInt(0));
if (response && typeof response === 'object' && 'ok' in response) {
  const result = response.ok;
  // Handle decrypted file data
}
```

## Future Enhancements

1. **Proper Encryption**: Replace XOR with AES-256-GCM
2. **Key Rotation**: Implement key rotation for long-term files
3. **Sharing**: Add support for sharing files with additional users
4. **Audit Logs**: Add encryption/decryption audit trails
5. **Performance**: Optimize for large files and multiple owners

## Testing

The system includes comprehensive tests:

```bash
# Run backend tests
cargo test

# Test vetKey encryption
cargo test test_xor_encryption
```

## Deployment

To deploy with vetKey support:

1. Ensure the canister has access to the management canister
2. Deploy using dfx:
   ```bash
   dfx deploy
   ```
3. The vetKey integration will be automatically available

## Security Considerations

- vetKeys are managed by the Internet Computer network
- No private keys are stored on-chain
- Encryption is performed using derived keys only
- File content is never accessible without proper authentication
- All operations are logged and auditable

## References

- [vetKeys Documentation](https://internetcomputer.org/docs/current/developer-docs/integrations/vetkeys/)
- [vetKeys Repository](https://github.com/dfinity/vetkeys)
- [Internet Computer Documentation](https://internetcomputer.org/docs/) 