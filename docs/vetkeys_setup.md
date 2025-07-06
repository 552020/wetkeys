# Vetkeys Encryption Setup Guide

This guide explains how to complete the vetkeys encryption implementation using the actual `ic-vetkd-utils` package.

## Prerequisites

- ICP project with dfx
- Backend canister with vetkd system API configured
- Frontend with React/TypeScript

## Step 1: Install ic-vetkd-utils Package

The `ic-vetkd-utils` package is required for frontend encryption. Currently, this package may need to be installed from a specific source or built locally.

### Option A: Install from npm (if available)
```bash
cd src/vtk_frontend
npm install ic-vetkd-utils
```

### Option B: Install from GitHub (if npm package not available)
```bash
cd src/vtk_frontend
npm install https://github.com/dfinity/ic-vetkd-utils.git
```

### Option C: Build from source
```bash
# Clone the ic-vetkd-utils repository
git clone https://github.com/dfinity/ic-vetkd-utils.git
cd ic-vetkd-utils

# Build the package
npm install
npm run build

# Install in your project
cd ../vtk/src/vtk_frontend
npm install ../../ic-vetkd-utils
```

## Step 2: Update VetkdCryptoService

Once the package is installed, update `src/vtk_frontend/src/services/vetkdCrypto.ts`:

The backend implementation is already properly structured following the official documentation pattern in `src/vtk_backend/src/vetkd/controller/vetkd_public_key.rs`.

```typescript
import * as vetkd from "ic-vetkd-utils";

export interface ActorType {
  vetkd_public_key(): Promise<{ Ok: Uint8Array } | { Err: string }>;
}

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

## Step 3: Generate Vetkd System API Declarations

Run the following command to generate the vetkd system API declarations:

```bash
dfx generate vetkd_system_api
```

This will create the necessary TypeScript declarations in `src/declarations/vetkd_system_api/`.

## Step 4: Test the Implementation

1. Start the local network:
```bash
dfx start --clean
```

2. Deploy the canisters:
```bash
dfx deploy
```

3. Start the frontend:
```bash
cd src/vtk_frontend
npm run dev
```

4. Test file upload with encryption:
   - Login with Internet Identity
   - Upload a file
   - Check that the file is encrypted before storage

## Step 5: Production Configuration

For production deployment:

1. Update the key ID in `src/vtk_backend/src/vetkd/controller/vetkd_public_key.rs`:
```rust
name: "key_1".to_string(), // Change from "insecure_test_key_1"
```

2. Ensure the vetkd system API is properly configured for the IC mainnet.

## Troubleshooting

### Common Issues

1. **Package not found**: Ensure `ic-vetkd-utils` is properly installed
2. **Declaration errors**: Run `dfx generate vetkd_system_api` after configuration changes
3. **Encryption errors**: Verify the vetkd system API is accessible and properly configured

### Debug Information

- Check browser console for encryption errors
- Verify backend logs for vetkd API calls
- Ensure user principal is correctly passed to encryption function

## Next Steps

After implementing encryption, the next phase will cover:
- Decryption key derivation
- Transport key management
- Secure key exchange with backend
- Data decryption and reconstruction

## References

- [Vetkeys Implementation Guide](../vetkeys_implementation_guide.md)
- [Official Vetkeys Documentation](https://internetcomputer.org/docs/current/developer-docs/integrations/vetkeys/)
- [ic-vetkd-utils Repository](https://github.com/dfinity/ic-vetkd-utils) 