# Backend Analysis: VetKey Encryption System Support

## Overview

The backend plays a **crucial supporting role** in the VetKey encryption system. While the frontend handles the actual encryption/decryption, the backend provides essential infrastructure and services that enable the VetKey system to function.

## Key Backend Responsibilities

### 1. **VetKey Infrastructure Management**

#### Root Public Key Provision

**File**: `src/backend/src/vetkey.rs`

```rust
pub async fn get_root_public_key() -> Result<Vec<u8>, String> {
    let args = VetKDPublicKeyArgs {
        key_id: vetkd_key_id(),
        context: vec![],
        canister_id: None,
    };

    let result = vetkd_public_key(&args)
        .await
        .map_err(|_| "Failed to retrieve root public key")?;

    Ok(result.public_key)
}
```

**Purpose**: Provides the canister's root public key that the frontend needs for IBE encryption
**API Endpoint**: `get_root_public_key()`

#### User Key Derivation

**File**: `src/backend/src/controller/get_user_key.rs`

```rust
pub async fn get_user_key(
    transport_public_key: Vec<u8>,
    username: String,
) -> Result<Vec<u8>, String> {
    let input = username.as_bytes().to_vec();

    let args = VetKDDeriveKeyArgs {
        input,
        context: vec![],
        transport_public_key,
        key_id: vetkd_key_id(),
    };

    let result = vetkd_derive_key(&args)
        .await
        .map_err(|_| "Failed to derive key")?;

    Ok(result.encrypted_key)
}
```

**Purpose**: Derives encrypted VetKeys for users using the VetKD (Verifiable Encrypted Threshold Key Derivation) system
**API Endpoint**: `get_user_key(transport_public_key, username)`

### 2. **Message Storage and Management**

#### Message Storage Structure

**File**: `src/backend/src/message/message_manager.rs`

```rust
pub struct Message {
    pub id: MessageId,
    pub sender: String,                 // username
    pub recipient: String,              // username
    pub ibe_encrypted_data: Vec<u8>,    // IBE encrypted for recipient
    pub sender_encrypted_data: Vec<u8>, // VetKey encrypted for sender
    pub timestamp: u64,
}
```

**Key Insight**: The backend stores **both encrypted versions** of each message:

- `ibe_encrypted_data` → For recipient's inbox
- `sender_encrypted_data` → For sender's sent folder

#### Message Sending Handler

**File**: `src/backend/src/message/controller/message_send.rs`

```rust
#[update]
async fn message_send(
    sender_username: String,
    recipient_username: String,
    ibe_encrypted_data: EncryptedMessageData,
    sender_encrypted_data: EncryptedMessageData,
) -> Result<MessageId, String> {
    MessageManager::send_message(
        sender_username,
        recipient_username,
        ibe_encrypted_data,
        sender_encrypted_data,
    )
}
```

**Purpose**: Receives and stores both encrypted versions of messages from the frontend

### 3. **Encrypted Notes Management**

#### Notes Storage

**File**: `src/backend/src/encrypted_notes/notes_manager.rs`

```rust
pub struct EncryptedNote {
    pub owner: Principal,
    pub data: Vec<u8>,        // VetKey encrypted data
    pub created_at: u64,
    pub updated_at: u64,
}
```

**Purpose**: Stores VetKey-encrypted notes that only the owner can decrypt

#### Notes API

**File**: `src/backend/src/encrypted_notes/controller/notes_save.rs`

```rust
#[update]
async fn notes_save(encrypted_data: EncryptedNoteData) -> Result<EncryptedNote, String> {
    auth_guard_no_anon()?;
    NotesManager::save_note(encrypted_data)
}
```

**Purpose**: Receives pre-encrypted notes from the frontend and stores them

### 4. **Timelock Management**

#### Timelock Storage

**File**: `src/backend/src/timelock/timelock_manager.rs`

```rust
pub struct TimeLock {
    pub timelock_id: u64,
    pub data: Vec<u8>,        // IBE encrypted data
    pub locked: bool,
}
```

**Purpose**: Stores time-locked messages that become decryptable after a specified time

## What the Backend Does NOT Do

### ❌ **No Encryption/Decryption**

The backend **never performs encryption or decryption**. All cryptographic operations happen in the frontend.

### ❌ **No Key Management**

The backend doesn't store or manage private keys. It only provides the infrastructure for VetKey derivation.

## What the Backend DOES Do

### ✅ **Secure Storage**

- Stores encrypted data without being able to decrypt it
- Maintains message metadata (sender, recipient, timestamps)
- Provides access control through principal-based ownership

### ✅ **VetKey Infrastructure**

- Provides root public keys for IBE encryption
- Derives encrypted VetKeys for users
- Manages the VetKD system integration

### ✅ **Data Retrieval**

- Returns encrypted data to authorized users
- Filters messages by sender/recipient
- Provides timelock status and management

## Backend-Frontend Interaction Flow

### 1. **Message Sending**

```
Frontend: Encrypts message twice (IBE + VetKey)
    ↓
Backend: Stores both encrypted versions
    ↓
Frontend: Retrieves encrypted messages for display
    ↓
Frontend: Decrypts messages using appropriate keys
```

### 2. **VetKey Setup**

```
Frontend: Requests root public key
    ↓
Backend: Provides root public key from VetKD
    ↓
Frontend: Requests user VetKey
    ↓
Backend: Derives encrypted VetKey using VetKD
    ↓
Frontend: Decrypts and uses VetKey for encryption
```

## Security Model

### **Zero-Knowledge Backend**

- Backend cannot decrypt any stored data
- All encryption/decryption happens client-side
- Backend only provides infrastructure and storage

### **Principal-Based Access Control**

- Notes are tied to user principals
- Messages are filtered by username
- Timelocks are managed by time-based identities

## Conclusion

The backend serves as a **secure, encrypted storage layer** that supports the VetKey system without compromising security. It provides the necessary infrastructure for VetKey derivation and manages encrypted data storage, while leaving all cryptographic operations to the frontend. This design ensures that the backend never has access to plaintext data or private keys, maintaining the security properties of the VetKey system.
