# VTK - Verifiable Threshold Keys File Storage

A secure file storage application built on the Internet Computer (ICP) that uses **vetKeys** (Verifiable Encrypted Threshold Keys) for end-to-end encryption and secure file sharing.

## Features

### 🔐 VetKeys Encryption
- **End-to-end encryption** using vetKeys threshold cryptography
- **Secure file sharing** with granular access control
- **Privacy-preserving** - only file owners and explicitly shared users can decrypt files
- **No key management** - keys are derived securely without exposing private keys

### 📁 File Management
- Upload files with automatic vetKeys encryption
- Download files with automatic decryption
- Share files with specific principals
- List and manage uploaded files
- Support for multiple file types

### 🛡️ Security
- **Threshold cryptography** - no single point of failure
- **Verifiable encryption** - cryptographic proofs ensure security
- **Principal-based access control** - secure sharing using Internet Identity
- **On-chain encryption** - files remain encrypted even on the blockchain

## Architecture

### Backend (Rust)
- **vetKeys integration** using the official vetKeys library
- **Encrypted file storage** with threshold key derivation
- **Permission-based access** control
- **Stable memory storage** for encrypted file contents

### Frontend (React + TypeScript)
- **VetKeys manager** for encrypted file operations
- **Internet Identity integration** for authentication
- **Modern UI** with Tailwind CSS
- **Real-time progress** tracking for uploads

## Getting Started

### Prerequisites
- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) - Internet Computer SDK
- [Node.js](https://nodejs.org/) - For frontend development
- [Internet Identity](https://internetcomputer.org/docs/current/developer-docs/integrations/internet-identity/) - For authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vtk
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd src/vtk_backend
   cargo build

   # Install frontend dependencies
   cd ../vtk_frontend
   npm install
   ```

3. **Deploy to local Internet Computer**
   ```bash
   cd ../..
   dfx start --background
   dfx deploy
   ```

4. **Start the frontend**
   ```bash
   cd src/vtk_frontend
   npm run dev
   ```

## Usage

### Uploading Files with VetKeys

1. **Select "Upload with VetKeys (Encrypted)"** from the upload target dropdown
2. **Choose a file** to upload
3. **The file is automatically encrypted** using vetKeys threshold cryptography
4. **Only you can decrypt** the file unless you explicitly share it

### Sharing Files

1. **Upload a file** using vetKeys encryption
2. **Use the share API** to grant access to specific principals
3. **Shared users can decrypt** the file using their Internet Identity

### Downloading Files

1. **Select a file** from your list
2. **The file is automatically decrypted** if you have permission
3. **Download the decrypted content** to your device

## API Reference

### Backend Endpoints

#### Upload File with VetKeys
```rust
async fn upload_file_atomic(request: UploadFileAtomicRequest) -> Result<u64, VetKeysError>
```

#### Download File with VetKeys
```rust
async fn download_file(file_id: u64, chunk_id: u64) -> FileDownloadResponse
```

#### Share File
```rust
async fn share_file(request: ShareFileRequest) -> FileSharingResponse
```

#### List Files
```rust
fn list_files() -> Vec<PublicFileMetadata>
```

### Frontend VetKeys Manager

```typescript
// Upload file with encryption
const fileId = await vetKeysManager.uploadFile(name, content, fileType, sharedWith);

// Download file with decryption
const fileData = await vetKeysManager.downloadFile(fileId, chunkId);

// Share file with principals
const success = await vetKeysManager.shareFile(fileId, principals);

// List all files
const files = await vetKeysManager.listFiles();
```

## VetKeys Technology

This application leverages [vetKeys](https://github.com/dfinity/vetkeys) from DFINITY, which provides:

- **Threshold BLS Signatures** - Secure, decentralized signing
- **Identity Based Encryption (IBE)** - Secure communication without key exchange
- **Verifiable Random Beacons** - Secure randomness for applications
- **Smart contract defined vetKeys** - Programmable access control

### Key Benefits

1. **Privacy-Preserving** - Files remain encrypted even on the blockchain
2. **Decentralized Key Management** - No traditional PKI required
3. **Threshold Security** - No single point of failure
4. **Verifiable Encryption** - Cryptographic proofs ensure security
5. **Granular Access Control** - Share with specific principals only

## Development

### Backend Development

The backend uses Rust with the following key components:

- **vetKeys integration** in `src/vtk_backend/src/vetkeys.rs`
- **API endpoints** in `src/vtk_backend/src/api/`
- **File storage** with stable memory
- **Encryption/decryption** using vetKeys threshold cryptography

### Frontend Development

The frontend uses React with TypeScript:

- **VetKeys manager** in `src/vtk_frontend/src/lib/vetkeys.ts`
- **File upload component** with encryption support
- **Modern UI** with Tailwind CSS
- **Internet Identity integration**

## Security Considerations

- **Always use Internet Identity** for authentication
- **Verify file permissions** before sharing
- **Keep your Internet Identity secure** - it controls access to your files
- **Monitor shared access** regularly
- **Use strong principals** for sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the Apache 2.0 License.

## Resources

- [VetKeys Documentation](https://internetcomputer.org/docs/building-apps/network-features/vetkeys/introduction)
- [Internet Computer Documentation](https://internetcomputer.org/docs/current/developer-docs/)
- [DFINITY VetKeys Repository](https://github.com/dfinity/vetkeys)
- [Internet Identity](https://internetcomputer.org/docs/current/developer-docs/integrations/internet-identity/)

Welcome to your new `vtk` project and to the Internet Computer development community. By default, creating a new project adds this README and some template files to your project directory. You can edit these template files to customize your project and to include your own code to speed up the development cycle.

To get started, you might want to explore the project directory structure and the default configuration file. Working with this project in your development environment will not affect any production deployment or identity tokens.

To learn more before you start working with `vtk`, see the following documentation available online:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Rust Canister Development Guide](https://internetcomputer.org/docs/current/developer-docs/backend/rust/)
- [ic-cdk](https://docs.rs/ic-cdk)
- [ic-cdk-macros](https://docs.rs/ic-cdk-macros)
- [Candid Introduction](https://internetcomputer.org/docs/current/developer-docs/backend/candid/)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd vtk/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor

### Walrus Development Setup

To use the Walrus file upload feature, you need to set up a Sui development keypair:

1. **Generate a keypair** (run this in your browser console or a Node.js script):

   ```javascript
   import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
   const keypair = Ed25519Keypair.generate();
   console.log(Array.from(keypair.export().privateKey));
   ```

2. **Create a `.env` file** in the project root and add:

   ```
   VITE_SUI_SECRET_KEY=123,456,789,...
   ```

   Replace the numbers with the output from step 1.

3. **Fund the wallet** with testnet SUI and WAL tokens for testing.

**Note**: This is for development only. In production, use real wallet integration.
