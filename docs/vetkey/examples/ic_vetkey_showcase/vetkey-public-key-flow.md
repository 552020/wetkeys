# VetKey Public Key Flow: Frontend to Backend Analysis

## Overview

This document traces the complete flow of the first call from the frontend to retrieve the root public key from the VetKey canister. This is a critical operation that establishes the foundation for all VetKey encryption operations in the application.

## 🔄 Complete Flow Diagram

```
Frontend React App
    ↓
useGetRootPublicKey Hook
    ↓
Backend Actor (ic-use-actor)
    ↓
HTTP Agent (@dfinity/agent)
    ↓
Internet Computer Network
    ↓
Backend Canister (Rust)
    ↓
Cross-Canister Call
    ↓
VetKD Management Canister (IC System)
    ↓
Root Public Key Response
    ↓
Frontend Processing
    ↓
Caching & Storage
```

## 🎯 Important Clarification: VetKey vs VetKD

### **VetKey Canister (Our Backend)**

- **Location**: `src/backend/` - Our custom Rust canister
- **Purpose**: Application logic, encryption/decryption, data storage
- **Role**: Acts as a client to the VetKD management canister

### **VetKD Management Canister (IC System)**

- **Location**: IC network system canister (not our code)
- **Purpose**: Provides VetKey infrastructure and key management
- **Role**: System-level canister that handles key derivation and management
- **Access**: Via `ic-cdk::management_canister::vetkd_public_key`

## 📋 Step-by-Step Flow Analysis

### **Step 1: Frontend Hook Initialization**

#### **Location**: `src/frontend/hooks/use-get-root-public-key.tsx`

```typescript
import { useBackendActor } from "@/backend-actor";
import { useRootKeyStore } from "@/state/root-key";
import { DerivedPublicKey } from "@dfinity/vetkeys";
import { useQuery } from "@tanstack/react-query";

export function useGetRootPublicKey() {
  const { actor: backend } = useBackendActor();
  const getCachedRootKey = useRootKeyStore((state) => state.getRootPublicKey);
  const setRootPublicKey = useRootKeyStore((state) => state.setRootPublicKey);

  return useQuery({
    queryKey: ["get_root_public_key"],
    enabled: !!backend,
    queryFn: async () => {
      if (!backend) {
        return;
      }

      // First, check if we have a cached root public key and return it if available
      // React Query caches queries but in this case we want to use a custom store
      // to minimize the number of times we fetch the root public key
      const cachedRootKey = getCachedRootKey();
      if (cachedRootKey) {
        return cachedRootKey;
      }

      // No cached root public key, we need to fetch it from the backend
      const rootPublicKeyResult = await backend.get_root_public_key();
      if ("Err" in rootPublicKeyResult) {
        throw new Error(`Error getting root public key: ${rootPublicKeyResult.Err}`);
      }

      // Create a new DerivedPublicKey instance from the public key bytes
      // returned by the backend
      const publicKeyBytes = rootPublicKeyResult.Ok as Uint8Array;
      const derivedPublicKey = DerivedPublicKey.deserialize(publicKeyBytes);

      // Store the derived public key in the user key store for future use
      setRootPublicKey(derivedPublicKey);

      return derivedPublicKey;
    },
  });
}
```

**What Happens**:

- **React Query Setup**: Configures caching and state management
- **Actor Access**: Gets backend actor from context
- **State Management**: Accesses Zustand store for caching
- **Conditional Execution**: Only runs when backend actor is available

### **Step 2: Backend Actor Context**

#### **Location**: `src/frontend/backend-actor.tsx`

```typescript
const actorContext = createActorContext<_SERVICE>();
export const useBackendActor = createUseActorHook<_SERVICE>(actorContext);

export default function BackendActorProvider({ children }: { children: ReactNode }) {
  const identity = useIdentityStore((state) => state.identity);

  return (
    <ActorProvider<_SERVICE> canisterId={canisterId} context={actorContext} identity={identity} idlFactory={idlFactory}>
      {children}
    </ActorProvider>
  );
}
```

**What Happens**:

- **Actor Context Creation**: Sets up React context for backend communication
- **Identity Integration**: Connects user identity to actor
- **Canister Configuration**: Uses generated canister ID and interface factory
- **Provider Pattern**: Wraps app with actor provider

### **Step 3: Actor Creation and Configuration**

#### **Location**: `src/backend/declarations/index.js`

```javascript
export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions });

  // Fetch root key for certificate validation during development
  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
      console.error(err);
    });
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};
```

**What Happens**:

- **HTTP Agent Creation**: Sets up communication with IC network
- **Environment Detection**: Handles local vs production network
- **Root Key Fetching**: For development certificate validation
- **Actor Instantiation**: Creates actor with Candid interface

### **Step 4: Candid Interface Factory**

#### **Location**: `src/backend/declarations/backend.did.js`

```javascript
export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ Ok: IDL.Vec(IDL.Nat8), Err: IDL.Text });

  return IDL.Service({
    get_root_public_key: IDL.Func([], [Result], []),
    // ... other methods
  });
};
```

**What Happens**:

- **Type Definition**: Defines `get_root_public_key` function signature
- **Return Type**: `Result` variant with `Ok: Vec<Nat8>` (blob) or `Err: Text`
- **Serialization**: Handles Candid serialization/deserialization

### **Step 5: Frontend API Call**

#### **Location**: `src/frontend/hooks/use-get-root-public-key.tsx`

```typescript
// No cached root public key, we need to fetch it from the backend
const rootPublicKeyResult = await backend.get_root_public_key();
if ("Err" in rootPublicKeyResult) {
  throw new Error(`Error getting root public key: ${rootPublicKeyResult.Err}`);
}
```

**What Happens**:

- **Actor Method Call**: Calls `get_root_public_key()` on backend actor
- **Candid Serialization**: Serializes empty parameters `[]`
- **HTTP Request**: Sends request to IC network
- **Response Handling**: Processes `Result` variant response

### **Step 6: Internet Computer Network**

#### **Network Layer**

```
Frontend → HTTP Agent → IC Boundary Node → Backend Canister
```

**What Happens**:

- **Request Routing**: IC boundary nodes route request to correct canister
- **Authentication**: Validates user identity and permissions
- **Canister Execution**: Invokes backend canister method
- **Response Routing**: Returns response through same path

### **Step 7: Backend Canister Entry Point**

#### **Location**: `src/backend/src/controller/get_root_public_key.rs`

```rust
#[update]
pub async fn get_root_public_key() -> Result<Vec<u8>, String> {
    let root_pubkey = vetkey::get_root_public_key().await?;
    Ok(root_pubkey)
}
```

**What Happens**:

- **Candid Deserialization**: Deserializes empty parameters
- **Method Invocation**: Calls internal `vetkey::get_root_public_key()`
- **Error Handling**: Converts internal errors to strings
- **Response Serialization**: Serializes `Vec<u8>` response

### **Step 8: VetKey Infrastructure**

#### **Location**: `src/backend/src/vetkey.rs`

```rust
pub async fn get_root_public_key() -> Result<Vec<u8>, String> {
    // Check cache first
    if let Some(public_key) = CANISTER_PUBLIC_KEY.with_borrow(|canister_public_key| canister_public_key.clone()) {
        return Ok(public_key);
    };

    // Prepare VetKD arguments
    let args = VetKDPublicKeyArgs {
        key_id: vetkd_key_id(),
        context: vec![],
        canister_id: None,
    };

    // Call VetKD management canister
    let result = vetkd_public_key(&args)
        .await
        .map_err(|_| "Failed to retrieve root public key")?;

    let public_key = result.public_key;

    // Cache the result
    CANISTER_PUBLIC_KEY.with_borrow_mut(|canister_public_key| {
        *canister_public_key = Some(public_key.clone());
    });

    Ok(public_key)
}
```

**What Happens**:

- **Cache Check**: First checks thread-local cache
- **VetKD Configuration**: Sets up key ID and arguments
- **Management Canister Call**: Calls IC's VetKD management canister
- **Response Processing**: Extracts public key from response
- **Caching**: Stores result in thread-local cache
- **Return**: Returns public key as `Vec<u8>`

### **Step 9: Backend Canister to VetKD Management Canister Call**

#### **Location**: `src/backend/src/vetkey.rs` (Line 35)

```rust
// Import from ic-cdk management canister
use ic_cdk::management_canister::{vetkd_public_key, VetKDCurve, VetKDKeyId, VetKDPublicKeyArgs};

// The actual cross-canister call
let result = vetkd_public_key(&args)
    .await
    .map_err(|_| "Failed to retrieve root public key")?;
```

**What Happens**:

- **Cross-Canister Call**: `vetkd_public_key()` is a **cross-canister call** from the backend canister to the VetKD management canister
- **IC-CDK Integration**: Uses `ic-cdk::management_canister::vetkd_public_key` function
- **Arguments**: Passes `VetKDPublicKeyArgs` with:
  - `key_id`: `VetKDKeyId` with BLS12-381_G2 curve and "dfx_test_key" name
  - `context`: Empty vector `vec![]`
  - `canister_id`: `None` (uses current canister)
- **Network Call**: This is an **inter-canister call** over the IC network
- **Response**: Returns `VetKDPublicKeyReply` with the public key bytes

#### **VetKD Management Canister (System Level)**

```rust
// This happens inside the IC's VetKD management canister
// (not in our code, but in the IC system)
pub struct VetKDPublicKeyReply {
    pub public_key: Vec<u8>,
}
```

**What Happens**:

- **Key Resolution**: VetKD canister resolves the `key_id` to the actual root key
- **Public Key Derivation**: Derives the public key from the root key using BLS12-381_G2 curve
- **System Response**: Returns the derived public key as `Vec<u8>`

### **Step 10: Response Processing**

#### **Backend to Frontend**

```
Backend Canister → IC Network → HTTP Agent → Frontend Actor → Hook
```

**What Happens**:

- **Candid Serialization**: Serializes `Vec<u8>` as blob
- **Network Transmission**: Sends through IC network
- **HTTP Agent Reception**: Receives and deserializes response
- **Actor Processing**: Converts to TypeScript types
- **Hook Processing**: Handles in React hook

### **Step 11: Frontend Processing**

#### **Location**: `src/frontend/hooks/use-get-root-public-key.tsx`

```typescript
// Create a new DerivedPublicKey instance from the public key bytes
const publicKeyBytes = rootPublicKeyResult.Ok as Uint8Array;
const derivedPublicKey = DerivedPublicKey.deserialize(publicKeyBytes);

// Store the derived public key in the user key store for future use
setRootPublicKey(derivedPublicKey);

return derivedPublicKey;
```

**What Happens**:

- **Type Conversion**: Converts blob to `Uint8Array`
- **VetKey Deserialization**: Creates `DerivedPublicKey` instance
- **State Storage**: Stores in Zustand store for caching
- **Return**: Returns processed public key

## 🔍 Key Components Analysis

### **1. Caching Strategy**

#### **Backend Caching**

```rust
thread_local! {
    static CANISTER_PUBLIC_KEY: RefCell<Option<Vec<u8>>> = const { RefCell::new(None) };
}
```

**Purpose**: Prevents repeated VetKD calls for same public key

#### **Frontend Caching**

```typescript
// React Query caching
queryKey: ["get_root_public_key"];

// Zustand store caching
const cachedRootKey = getCachedRootKey();
```

**Purpose**: Prevents repeated network calls and provides persistence

### **2. Error Handling**

#### **Backend Error Handling**

```rust
.map_err(|_| "Failed to retrieve root public key")?;
```

#### **Frontend Error Handling**

```typescript
if ("Err" in rootPublicKeyResult) {
  throw new Error(`Error getting root public key: ${rootPublicKeyResult.Err}`);
}
```

### **3. Type Safety**

#### **Candid Interface**

```candid
get_root_public_key : () -> (Result)
type Result = variant { Ok : blob; Err : text };
```

#### **TypeScript Interface**

```typescript
'get_root_public_key' : ActorMethod<[], Result>
export type Result = { 'Ok' : Uint8Array | number[] } | { 'Err' : string };
```

## 📊 Performance Considerations

### **1. Network Latency**

- **IC Network**: ~200-500ms round trip
- **VetKD Call**: Additional ~100-200ms
- **Total**: ~300-700ms for first call

### **2. Caching Benefits**

- **Subsequent Calls**: ~1-5ms (cached)
- **Memory Usage**: ~32 bytes per public key
- **Persistence**: Survives page reloads

### **3. Optimization Strategies**

- **Lazy Loading**: Only loads when needed
- **Background Loading**: Can be preloaded
- **Error Retry**: Automatic retry on failure

## 🎯 Security Considerations

### **1. Public Key Nature**

- **No Secrets**: Root public key is public information
- **Verification**: Can be verified against IC network
- **Tampering**: Protected by IC consensus

### **2. Identity Integration**

- **User Context**: Tied to user identity
- **Access Control**: No sensitive data exposure
- **Audit Trail**: All calls are logged

### **3. Network Security**

- **HTTPS**: All communication over HTTPS
- **Certificate Validation**: IC certificates validated
- **Man-in-the-Middle**: Protected by IC consensus

## 🔧 Debugging and Monitoring

### **1. Frontend Debugging**

```typescript
// Add logging to hook
console.log("Fetching root public key...");
const rootPublicKeyResult = await backend.get_root_public_key();
console.log("Root public key result:", rootPublicKeyResult);
```

### **2. Backend Debugging**

```rust
// Add logging to backend
ic_cdk::println!("Getting root public key...");
let result = vetkd_public_key(&args).await;
ic_cdk::println!("VetKD result: {:?}", result);
```

### **3. Network Monitoring**

- **IC Dashboard**: Monitor canister calls
- **Boundary Node Logs**: Network-level debugging
- **Performance Metrics**: Response time tracking

## 🎯 Conclusion

The VetKey public key flow demonstrates a **sophisticated multi-layer architecture**:

- **Frontend Layer**: React hooks, caching, and state management
- **Network Layer**: HTTP agent, IC network, and routing
- **Backend Layer**: Rust canister, VetKey infrastructure, and caching
- **System Layer**: VetKD management canister and IC consensus

The flow is **optimized for performance** through multiple caching layers and **designed for security** through proper authentication and validation. This establishes the foundation for all subsequent VetKey operations in the application.
