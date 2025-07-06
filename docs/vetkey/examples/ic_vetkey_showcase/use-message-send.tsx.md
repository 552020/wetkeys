```tsx
import { useBackendActor } from "@/backend-actor";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { IbeCiphertext, IbeIdentity, IbeSeed } from "@dfinity/vetkeys";
import { useGetRootPublicKey } from "@/hooks/use-get-root-public-key";
import { useGetUserKey } from "@/hooks/use-get-user-key";
import { useIdentityStore } from "@/state/identity";

type SendMessageArgs = {
  message: string;
  recipient: string;
};

export function useMessageSend() {
  const { actor: backend } = useBackendActor();
  const { data: rootPublicKey } = useGetRootPublicKey();
  const { data: userKey } = useGetUserKey();
  const username = useIdentityStore((state) => state.username);

  return useMutation({
    mutationFn: async ({ message, recipient }: SendMessageArgs) => {
      if (!backend) {
        throw new Error("Backend actor not available");
      }
      if (!rootPublicKey) {
        throw new Error("Root public key not available");
      }
      if (!userKey) {
        throw new Error("User key not available");
      }
      if (!username) {
        throw new Error("Username not available");
      }

      const messageBytes = new TextEncoder().encode(message);

      // Encrypt message for recipient using IBE
      const ibeEncryptedMessage = IbeCiphertext.encrypt(
        rootPublicKey,
        IbeIdentity.fromString(recipient),
        messageBytes,
        IbeSeed.random()
      );

      // Encrypt message for sender using VetKey (for sent folder)
      const dkm = await userKey.asDerivedKeyMaterial();
      const senderEncryptedMessage = await dkm.encryptMessage(message, "");

      const result = await backend.message_send(
        username,
        recipient,
        Array.from(ibeEncryptedMessage.serialize()),
        senderEncryptedMessage
      );

      if ("Err" in result) {
        throw new Error(`Error sending message: ${result.Err}`);
      }

      await queryClient.invalidateQueries({
        queryKey: ["message_list_received"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message_list_sent"],
      });

      return result.Ok;
    },
  });
}
```

# Analysis: use-message-send.tsx - Principal File for Message Encryption

## Overview

`use-message-send.tsx` is the **principal file** for message encryption in the VetKey showcase application. It handles the encryption of messages for secure user-to-user communication using the VetKey system.

## File Location

```
src/frontend/message/hooks/use-message-send.tsx
```

## Core Encryption Entry Point

The main encryption occurs at **line 38**:

```typescript
const ibeEncryptedMessage = IbeCiphertext.encrypt(
  rootPublicKey,
  IbeIdentity.fromString(recipient),
  messageBytes,
  IbeSeed.random()
);
```

This is where the **primary encryption** happens using **IBE (Identity-Based Encryption)**.

## Dual Encryption Strategy

The file implements a **dual encryption approach** to solve the messaging access problem:

### 1. IBE Encryption - For Recipient Access

```typescript
const ibeEncryptedMessage = IbeCiphertext.encrypt(
  rootPublicKey,
  IbeIdentity.fromString(recipient),
  messageBytes,
  IbeSeed.random()
);
```

**Purpose**: Enable the recipient to decrypt and read the message
**Method**: Identity-Based Encryption using recipient's username as identity
**Access Control**: Only the recipient can decrypt this version

### 2. VetKey Encryption - For Sender's Sent Folder

```typescript
const dkm = await userKey.asDerivedKeyMaterial();
const senderEncryptedMessage = await dkm.encryptMessage(message, "");
```

**Purpose**: Enable the sender to store and view their sent messages
**Method**: Uses sender's personal VetKey for encryption
**Access Control**: Only the sender can decrypt this version

## Why Dual Encryption?

This design solves a fundamental messaging challenge:

- **Without sender encryption**: Sender cannot view their own sent messages later
- **Without recipient encryption**: Recipient cannot read the incoming message
- **With both encryptions**: Both parties can access the message through their respective encrypted versions

## Backend Integration

Both encrypted versions are sent to the backend:

```typescript
const result = await backend.message_send(
  username,
  recipient,
  Array.from(ibeEncryptedMessage.serialize()),
  senderEncryptedMessage
);
```

**Storage Strategy**:

- `ibeEncryptedMessage` → Stored for recipient's inbox
- `senderEncryptedMessage` → Stored for sender's sent folder

## Dependencies

The encryption process relies on several key components:

1. **Root Public Key**: `useGetRootPublicKey()` - Canister's root public key for IBE
2. **User Key**: `useGetUserKey()` - Sender's personal VetKey
3. **Backend Actor**: Communication with Internet Computer backend
4. **Identity Store**: Current user's identity information

## Similarity to Note Encryption

The VetKey encryption method used here is **identical** to the note encryption in `use-notes-save.tsx`:

```typescript
// Same pattern in both files:
const dkm = await userKey.asDerivedKeyMaterial();
const encryptedMessage = await dkm.encryptMessage(message, "");
```

The key difference is the **principal/identity** used:

- **Notes**: Encrypted with sender's VetKey → Only creator can decrypt
- **Messages**: Encrypted with recipient's IBE identity → Only recipient can decrypt

## Conclusion

`use-message-send.tsx` serves as the principal entry point for message encryption, implementing a sophisticated dual-encryption strategy that ensures both sender and recipient can access messages while maintaining proper access control through the VetKey system's identity-based encryption capabilities.
