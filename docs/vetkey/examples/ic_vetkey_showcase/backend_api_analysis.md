# Analysis: Backend API and Candid Interface (DID) - VetKey System

## Overview

The backend API is defined through the Candid interface definition (DID) file, which serves as the contract between the frontend and backend. This analysis examines the API structure with special focus on VetKey-specific functionality and the three main feature areas: VetKey infrastructure, encrypted notes, messaging, and timelock systems.

## 📋 Candid Interface Definition (backend.did)

### **Complete API Definition**

```candid
type EncryptedNote = record {
  updated_at : nat64;
  owner : principal;
  data : blob;
  created_at : nat64;
};
type ReceivedMessage = record {
  id : nat64;
  encrypted_data : blob;
  recipient : text;
  sender : text;
  timestamp : nat64;
};
type Result = variant { Ok : blob; Err : text };
type Result_1 = variant { Ok : vec ReceivedMessage; Err : text };
type Result_2 = variant { Ok : vec SentMessage; Err : text };
type Result_3 = variant { Ok : nat64; Err : text };
type Result_4 = variant { Ok : bool; Err : text };
type Result_5 = variant { Ok : EncryptedNote; Err : text };
type Result_6 = variant { Ok : TimeLock; Err : text };
type SentMessage = record {
  id : nat64;
  encrypted_data : blob;
  recipient : text;
  sender : text;
  timestamp : nat64;
};
type TimeLock = record { data : blob; locked : bool; timelock_id : nat64 };
service : {
  get_root_public_key : () -> (Result);
  get_user_key : (blob, text) -> (Result);
  message_list_received : (text) -> (Result_1) query;
  message_list_sent : (text) -> (Result_2) query;
  message_send : (text, text, blob, blob) -> (Result_3);
  notes_delete : () -> (Result_4);
  notes_get : () -> (Result_5) query;
  notes_has : () -> (Result_4) query;
  notes_save : (blob) -> (Result_5);
  timelock_create : (nat64, blob) -> (Result_6);
  timelock_list : () -> (vec TimeLock) query;
  timelock_open : (nat64) -> (Result_6);
}
```

## 🔍 Data Type Analysis

### **1. VetKey Infrastructure Types**

#### **Result Types**

```candid
type Result = variant { Ok : blob; Err : text };
```

**Purpose**: Generic result wrapper for VetKey operations

- **`Ok : blob`**: Binary data (encrypted VetKeys, public keys)
- **`Err : text`**: Error messages
- **Usage**: `get_root_public_key`, `get_user_key`

**VetKey-Specific Usage:**

- **Root Public Key**: Returns canister's root public key as blob
- **User Key**: Returns encrypted VetKey as blob

### **2. Encrypted Notes Types**

#### **EncryptedNote**

```candid
type EncryptedNote = record {
  updated_at : nat64;
  owner : principal;
  data : blob;
  created_at : nat64;
};
```

**Purpose**: VetKey-encrypted personal notes

- **`owner : principal`**: User who owns the note
- **`data : blob`**: VetKey-encrypted note content
- **`created_at/updated_at : nat64`**: Timestamps

**VetKey Integration:**

- **Encryption**: Notes encrypted with user's personal VetKey
- **Access Control**: Principal-based ownership
- **Storage**: Only encrypted data stored on-chain

#### **Result_4 and Result_5**

```candid
type Result_4 = variant { Ok : bool; Err : text };
type Result_5 = variant { Ok : EncryptedNote; Err : text };
```

**Usage:**

- **`Result_4`**: Boolean operations (`notes_has`, `notes_delete`)
- **`Result_5`**: EncryptedNote operations (`notes_get`, `notes_save`)

### **3. Messaging Types (VetKey + IBE)**

#### **Message Types**

```candid
type ReceivedMessage = record {
  id : nat64;
  encrypted_data : blob;
  recipient : text;
  sender : text;
  timestamp : nat64;
};

type SentMessage = record {
  id : nat64;
  encrypted_data : blob;
  recipient : text;
  sender : text;
  timestamp : nat64;
};
```

**Purpose**: Dual-encrypted messaging system

- **`encrypted_data : blob`**: IBE-encrypted (received) or VetKey-encrypted (sent)
- **`recipient/sender : text`**: Username identifiers
- **`timestamp : nat64`**: Message creation time

**Encryption Strategy:**

- **Received Messages**: IBE-encrypted for recipient
- **Sent Messages**: VetKey-encrypted for sender's sent folder

#### **Message Result Types**

```candid
type Result_1 = variant { Ok : vec ReceivedMessage; Err : text };
type Result_2 = variant { Ok : vec SentMessage; Err : text };
type Result_3 = variant { Ok : nat64; Err : text };
```

**Usage:**

- **`Result_1`**: List of received messages
- **`Result_2`**: List of sent messages
- **`Result_3`**: Message ID after sending

### **4. Timelock Types (IBE + VetKey)**

#### **TimeLock**

```candid
type TimeLock = record {
  data : blob;
  locked : bool;
  timelock_id : nat64;
};
```

**Purpose**: Time-based encrypted messages

- **`data : blob`**: IBE-encrypted with time-based identity
- **`locked : bool`**: Whether timelock is still active
- **`timelock_id : nat64`**: Unique identifier (includes release time)

**VetKey Integration:**

- **Encryption**: IBE with time-based identity
- **Decryption**: VetKey-derived key after time expiration
- **Canister-Side**: Backend can decrypt after time lock expires

#### **Result_6**

```candid
type Result_6 = variant { Ok : TimeLock; Err : text };
```

**Usage**: Timelock operations (`timelock_create`, `timelock_open`)

## 🎯 Service Method Analysis

### **1. VetKey Infrastructure Methods**

#### **get_root_public_key**

```candid
get_root_public_key : () -> (Result)
```

**Purpose**: Provides canister's root public key for IBE encryption

- **Input**: None
- **Output**: Root public key as blob
- **VetKey Usage**: Required for IBE encryption in messaging and timelock

**Implementation**: `src/backend/src/controller/get_root_public_key.rs`

#### **get_user_key**

```candid
get_user_key : (blob, text) -> (Result)
```

**Purpose**: Derives encrypted VetKey for user

- **Input**:
  - `blob`: Transport public key
  - `text`: Username
- **Output**: Encrypted VetKey as blob
- **VetKey Usage**: User key derivation using VetKD system

**Implementation**: `src/backend/src/controller/get_user_key.rs`

### **2. Encrypted Notes Methods (VetKey Only)**

#### **notes_save**

```candid
notes_save : (blob) -> (Result_5)
```

**Purpose**: Stores VetKey-encrypted note

- **Input**: `blob` - Pre-encrypted note data
- **Output**: `EncryptedNote` with metadata
- **VetKey Usage**: Stores note encrypted with user's personal VetKey

#### **notes_get**

```candid
notes_get : () -> (Result_5) query
```

**Purpose**: Retrieves user's encrypted note

- **Input**: None (uses caller principal)
- **Output**: `EncryptedNote` for authenticated user
- **Query Method**: Read-only operation

#### **notes_has**

```candid
notes_has : () -> (Result_4) query
```

**Purpose**: Checks if user has stored note

- **Input**: None (uses caller principal)
- **Output**: Boolean indicating note existence
- **Query Method**: Read-only operation

#### **notes_delete**

```candid
notes_delete : () -> (Result_4)
```

**Purpose**: Deletes user's encrypted note

- **Input**: None (uses caller principal)
- **Output**: Boolean indicating success
- **VetKey Usage**: Removes VetKey-encrypted data

### **3. Messaging Methods (VetKey + IBE)**

#### **message_send**

```candid
message_send : (text, text, blob, blob) -> (Result_3)
```

**Purpose**: Sends dual-encrypted message

- **Input**:
  - `text`: Sender username
  - `text`: Recipient username
  - `blob`: IBE-encrypted message (for recipient)
  - `blob`: VetKey-encrypted message (for sender)
- **Output**: Message ID
- **VetKey Usage**: Stores both encryption versions

#### **message_list_received**

```candid
message_list_received : (text) -> (Result_1) query
```

**Purpose**: Lists IBE-encrypted received messages

- **Input**: `text` - Recipient username
- **Output**: Array of `ReceivedMessage`
- **Query Method**: Read-only operation

#### **message_list_sent**

```candid
message_list_sent : (text) -> (Result_2) query
```

**Purpose**: Lists VetKey-encrypted sent messages

- **Input**: `text` - Sender username
- **Output**: Array of `SentMessage`
- **Query Method**: Read-only operation

### **4. Timelock Methods (IBE + VetKey)**

#### **timelock_create**

```candid
timelock_create : (nat64, blob) -> (Result_6)
```

**Purpose**: Creates time-locked encrypted message

- **Input**:
  - `nat64`: Timelock ID (includes release time)
  - `blob`: IBE-encrypted message data
- **Output**: `TimeLock` record
- **VetKey Usage**: IBE encryption with time-based identity

#### **timelock_list**

```candid
timelock_list : () -> (vec TimeLock) query
```

**Purpose**: Lists all timelocks

- **Input**: None
- **Output**: Array of `TimeLock`
- **Query Method**: Read-only operation

#### **timelock_open**

```candid
timelock_open : (nat64) -> (Result_6)
```

**Purpose**: Opens expired timelock

- **Input**: `nat64` - Timelock ID
- **Output**: `TimeLock` with decrypted data
- **VetKey Usage**: Canister-side decryption using VetKey-derived key

## 🔧 TypeScript Bindings Analysis

### **Generated TypeScript Interface**

```typescript
export interface _SERVICE {
  get_root_public_key: ActorMethod<[], Result>;
  get_user_key: ActorMethod<[Uint8Array | number[], string], Result>;
  message_list_received: ActorMethod<[string], Result_1>;
  message_list_sent: ActorMethod<[string], Result_2>;
  message_send: ActorMethod<[string, string, Uint8Array | number[], Uint8Array | number[]], Result_3>;
  notes_delete: ActorMethod<[], Result_4>;
  notes_get: ActorMethod<[], Result_5>;
  notes_has: ActorMethod<[], Result_4>;
  notes_save: ActorMethod<[Uint8Array | number[]], Result_5>;
  timelock_create: ActorMethod<[bigint, Uint8Array | number[]], Result_6>;
  timelock_list: ActorMethod<[], Array<TimeLock>>;
  timelock_open: ActorMethod<[bigint], Result_6>;
}
```

### **Type Mappings**

- **`blob`** → `Uint8Array | number[]`
- **`nat64`** → `bigint`
- **`text`** → `string`
- **`principal`** → `Principal`
- **`bool`** → `boolean`

## 📊 API Method Categories

### **VetKey Infrastructure (2 methods)**

| Method                | Type   | Purpose             | VetKey Usage    |
| --------------------- | ------ | ------------------- | --------------- |
| `get_root_public_key` | Update | Root key provision  | IBE encryption  |
| `get_user_key`        | Update | User key derivation | VetKey creation |

### **Encrypted Notes (4 methods)**

| Method         | Type   | Purpose              | VetKey Usage      |
| -------------- | ------ | -------------------- | ----------------- |
| `notes_save`   | Update | Store encrypted note | VetKey encryption |
| `notes_get`    | Query  | Retrieve note        | VetKey decryption |
| `notes_has`    | Query  | Check note existence | Access control    |
| `notes_delete` | Update | Delete note          | Data removal      |

### **Messaging (3 methods)**

| Method                  | Type   | Purpose       | VetKey Usage    |
| ----------------------- | ------ | ------------- | --------------- |
| `message_send`          | Update | Send message  | Dual encryption |
| `message_list_received` | Query  | List received | IBE access      |
| `message_list_sent`     | Query  | List sent     | VetKey access   |

### **Timelock (3 methods)**

| Method            | Type   | Purpose         | VetKey Usage      |
| ----------------- | ------ | --------------- | ----------------- |
| `timelock_create` | Update | Create timelock | IBE encryption    |
| `timelock_list`   | Query  | List timelocks  | Access control    |
| `timelock_open`   | Update | Open timelock   | VetKey decryption |

## 🔍 Security and Access Control

### **Principal-Based Authentication**

- **Notes**: Tied to caller principal
- **Messages**: Username-based filtering
- **Timelocks**: Public access for listing, authenticated for creation

### **Query vs Update Methods**

- **Query Methods**: Read-only, no state changes
- **Update Methods**: State-modifying operations

### **Encryption Strategy**

- **VetKey-Only**: Notes (personal encryption)
- **IBE-Only**: Received messages (recipient encryption)
- **Dual Encryption**: Sent messages (both sender and recipient)
- **Time-Based IBE**: Timelocks (time-based access)

## 🎯 VetKey-Specific Design Patterns

### **1. Zero-Knowledge Backend**

- **No Plaintext**: Backend never sees unencrypted data
- **Encrypted Storage**: All data stored as blobs
- **Client-Side Crypto**: Encryption/decryption in frontend

### **2. Dual Encryption Strategy**

- **Message Sending**: Two encrypted versions stored
- **Access Control**: Different keys for different access patterns
- **Privacy**: Sender and recipient have separate encrypted copies

### **3. Time-Based Access Control**

- **Timelock Creation**: IBE with time-based identity
- **Timelock Opening**: VetKey-derived key after expiration
- **Public Access**: Decrypted data becomes publicly accessible

## 🛠️ Implementation Architecture

### **Module Structure**

```
src/backend/src/
├── lib.rs                 # Main module with export_candid!
├── controller/            # API endpoint implementations
│   ├── get_root_public_key.rs
│   └── get_user_key.rs
├── encrypted_notes/       # Notes feature
├── message/              # Messaging feature
├── timelock/             # Timelock feature
└── vetkey.rs             # VetKey infrastructure
```

### **Candid Generation**

```rust
use ic_cdk::export_candid;
export_candid!();
```

**Purpose**: Auto-generates Candid interface from Rust code

## 🎯 Conclusion

The backend API is **specifically designed for VetKey functionality** with:

- **Comprehensive VetKey Support**: Root keys, user keys, encryption operations
- **Three Feature Areas**: Notes (VetKey), Messages (VetKey + IBE), Timelock (IBE + VetKey)
- **Zero-Knowledge Design**: Backend never handles plaintext data
- **Type Safety**: Strong typing through Candid interface
- **Access Control**: Principal-based and username-based security

The API demonstrates a **sophisticated encryption strategy** that leverages VetKeys for personal data and IBE for shared/recipient data, while maintaining the security properties of the VetKey system throughout.
