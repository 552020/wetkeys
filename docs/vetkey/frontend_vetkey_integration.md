# Frontend VetKey Integration Documentation

## Overview

This document describes the frontend VetKey integration implementation for the VTK (VetKey File Manager) project. The integration provides client-side encryption and decryption using Identity-Based Encryption (IBE) with the user's principal as the identity.

## Architecture

### Core Components

1. **VetkdCryptoService** - Core encryption/decryption service
2. **EnhancedFileService** - File operations with VetKey integration
3. **EnhancedFileUpload** - UI component for encrypted file uploads
4. **EnhancedFileList** - UI component for encrypted file management
5. **VetKeyTest** - Test component to verify VetKey functionality

### Data Flow

```
User Upload:
File → VetkdCryptoService.encrypt() → Backend (encrypted)

User Download:
Backend (encrypted) → VetkdCryptoService.decrypt() → File
```

## Implementation Details

### 1. VetkdCryptoService (`src/services/vetkdCrypto.ts`)

The core service that handles all VetKey operations:

```typescript
export class VetkdCryptoService {
  constructor(private actor: ActorType) {}

  async encrypt(data: ArrayBuffer, userPrincipalBytes: Uint8Array): Promise<Uint8Array>;
  async decrypt(encryptedData: Uint8Array, userPrincipalBytes: Uint8Array, fileId?: bigint): Promise<Uint8Array>;
}
```

**Encryption Process:**

1. Get public key from backend via `actor.vetkd_public_key()`
2. Generate random seed for encryption
3. Encrypt data using VetKey IBE with user's principal as identity
4. Return serialized encrypted data

**Decryption Process:**

1. Generate transport secret key for secure key exchange
2. Get public key from backend
3. Get encrypted decryption key via `actor.vetkd_encrypted_key()`
4. Decrypt the key using transport secret
5. Decrypt file data using derived key

### 2. EnhancedFileService (`src/services/enhancedFileService.ts`)

High-level file operations with VetKey integration:

```typescript
export class EnhancedFileService {
  async uploadFileWithEncryption(file: File): Promise<bigint>;
  async downloadFileWithDecryption(file: FileMetadata): Promise<void>;
  async deleteFile(file: FileMetadata): Promise<void>;
  async listFiles(): Promise<FileMetadata[]>;
}
```

**Key Features:**

- Automatic encryption on upload
- Automatic decryption on download
- Support for both ICP and Walrus storage
- File metadata tracking with encryption status

### 3. UI Components

#### EnhancedFileUpload (`src/components/EnhancedFileUpload.tsx`)

Provides a user-friendly interface for uploading files with VetKey encryption:

- File selection with drag-and-drop support
- Progress tracking during encryption and upload
- Error handling and success feedback
- Educational information about VetKey security

#### EnhancedFileList (`src/components/EnhancedFileList.tsx`)

Manages encrypted file display and operations:

- Visual indicators for encrypted vs unencrypted files
- Download with automatic decryption
- File deletion
- Status tracking and error handling

#### VetKeyTest (`src/components/VetKeyTest.tsx`)

Test component to verify VetKey functionality:

- End-to-end encryption/decryption test
- Step-by-step progress feedback
- Verification of data integrity
- Error reporting for debugging

## Security Features

### Identity-Based Encryption (IBE)

- **Identity**: User's principal ID serves as the encryption identity
- **Access Control**: Only the user with the matching principal can decrypt
- **No Key Storage**: Private keys are derived on-demand, never stored

### Client-Side Security

- **Encryption**: Happens entirely in the browser
- **Key Derivation**: Uses secure transport keys for key exchange
- **No Plaintext Exposure**: Backend never sees unencrypted file content

### Transport Security

- **Secure Key Exchange**: Uses transport keys for encrypted key delivery
- **Random Seeds**: Cryptographically secure random number generation
- **Error Handling**: Graceful failure without exposing sensitive data

## Integration Points

### Backend API Requirements

The frontend expects the following backend methods:

```typescript
interface ActorType {
  // VetKey methods
  vetkd_public_key: () => Promise<{ Ok: Uint8Array } | { Err: string }>;
  vetkd_encrypted_key: (
    encryptionPublicKey: Uint8Array,
    fileId?: bigint
  ) => Promise<{ Ok: Uint8Array } | { Err: string }>;

  // File operations
  upload_file_atomic: (request: any) => Promise<bigint>;
  download_file: (fileId: bigint, chunkId: bigint) => Promise<any>;
  delete_file: (fileId: bigint) => Promise<any>;
  list_files: () => Promise<any[]>;
}
```

### Dependencies

```json
{
  "@dfinity/auth-client": "^2.2.0",
  "ic-vetkd-utils": "^0.3.0"
}
```

## Usage Examples

### Basic File Upload with Encryption

```typescript
const fileService = new EnhancedFileService(actor);
fileService.setUserPrincipal(userPrincipal);

const fileId = await fileService.uploadFileWithEncryption(file);
console.log("File uploaded with VetKey encryption:", fileId);
```

### File Download with Decryption

```typescript
const fileService = new EnhancedFileService(actor);
fileService.setUserPrincipal(userPrincipal);

await fileService.downloadFileWithDecryption(fileMetadata);
// File is automatically decrypted and downloaded
```

### Direct VetKey Operations

```typescript
const vetkdCrypto = new VetkdCryptoService(actor);

// Encrypt data
const encryptedData = await vetkdCrypto.encrypt(fileBuffer, userPrincipal.toUint8Array());

// Decrypt data
const decryptedData = await vetkdCrypto.decrypt(encryptedData, userPrincipal.toUint8Array());
```

## Error Handling

### Common Error Scenarios

1. **User Principal Not Available**

   - Error: "User principal not set. Please login first."
   - Solution: Ensure user is authenticated and principal is set

2. **Backend API Failure**

   - Error: "Error getting public key from backend"
   - Solution: Check backend connectivity and VetKey API availability

3. **Decryption Failure**

   - Error: "Failed to decrypt file. You may not have permission to access this file."
   - Solution: Verify file ownership and principal permissions

4. **Transport Key Issues**
   - Error: "Error getting encrypted key from backend"
   - Solution: Check network connectivity and backend response

### Error Recovery

- **Graceful Degradation**: Fallback to regular file operations if VetKey fails
- **User Feedback**: Clear error messages with actionable guidance
- **Retry Logic**: Automatic retry for transient network issues
- **State Management**: Proper cleanup on errors

## Testing

### VetKey Test Component

The `VetKeyTest` component provides comprehensive testing:

1. **Public Key Retrieval**: Verifies backend connectivity
2. **Encryption Test**: Tests data encryption with user principal
3. **Decryption Test**: Tests data decryption and verification
4. **End-to-End Test**: Complete encryption/decryption cycle

### Manual Testing Steps

1. Login with Internet Identity
2. Run VetKey test to verify functionality
3. Upload a file using VetKey encryption
4. Download the file to verify decryption
5. Check file metadata for encryption status

## Performance Considerations

### Optimization Strategies

- **Lazy Loading**: VetKey utils loaded only when needed
- **Caching**: Public keys cached to reduce API calls
- **Progress Tracking**: Real-time feedback during operations
- **Memory Management**: Proper cleanup of large file buffers

### Browser Compatibility

- **Web Crypto API**: Uses `window.crypto.getRandomValues()` for secure randomness
- **ArrayBuffer Support**: Full support for binary data handling
- **WASM Loading**: VetKey utils loaded as WebAssembly for performance

## Future Enhancements

### Planned Features

1. **File Sharing**: Support for sharing encrypted files between users
2. **Key Rotation**: Automatic key rotation for enhanced security
3. **Batch Operations**: Efficient handling of multiple files
4. **Offline Support**: Local encryption/decryption without network

### Security Improvements

1. **Hardware Security**: Integration with hardware security modules
2. **Multi-Factor Authentication**: Additional authentication layers
3. **Audit Logging**: Comprehensive security event logging
4. **Compliance**: Support for regulatory compliance requirements

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure `ic-vetkd-utils` is properly installed
2. **Runtime Errors**: Check browser console for detailed error messages
3. **Network Issues**: Verify backend connectivity and CORS settings
4. **Memory Issues**: Monitor memory usage with large files

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem("vetkey-debug", "true");
```

This will provide detailed console output for troubleshooting.

## Conclusion

The frontend VetKey integration provides a secure, user-friendly interface for file encryption and decryption using Identity-Based Encryption. The implementation follows best practices for security, performance, and user experience while maintaining compatibility with the existing VTK file management system.

The modular architecture allows for easy extension and maintenance, while the comprehensive testing ensures reliable operation in production environments.
