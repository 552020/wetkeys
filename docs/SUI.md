# Sui Wallets: Formats, Conversion, and Management

## Wallet Key Formats

Sui wallets can use private keys in different formats depending on the tool:

- **Base64-encoded private key**: Used in TypeScript/JavaScript SDKs and `.env` files.
- **Bech32-encoded private key** (`sui_private_key1...`): Used by the Sui CLI for wallet import/export.

---

## Converting Base64 Private Key to Bech32 (Sui CLI Format)

If you have a base64-encoded private key (from `.env` or `wallet.json`), you can convert it to the Sui CLI bech32 format using the following script:

```typescript
// convert_to_bech32.ts
import { encodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Buffer } from "buffer";

// Paste your base64 private key here:
const base64 = "PASTE_YOUR_BASE64_KEY_HERE";
const bytes = Buffer.from(base64, "base64");
const bech32 = encodeSuiPrivateKey(bytes);
console.log("Sui CLI bech32 private key:");
console.log(bech32);
```

**How to use:**

1. Install dependencies: `npm install @mysten/sui buffer`
2. Save the script as `convert_to_bech32.ts`.
3. Replace the base64 string with your key.
4. Run: `npx tsx convert_to_bech32.ts`

---

## Example Wallets (from `sui keytool list`)

```
╭─────────────────┬──────────────────────────────────────────────────────────────────────╮
│ alias           │  unruffled-chrysoprase                                               │
│ suiAddress      │  0x639decaeb54b7a30184da4bc37b98adf0c163737adc76b0dabfc2b9621794a77  │
│ publicBase64Key │  AKD3kWnlKtXTQ4aRRu2q8pJrt4Q5/EcM7dlVLASQ71Xr                        │
│ keyScheme       │  ed25519                                                             │
│ flag            │  0                                                                   │
│ peerId          │  a0f79169e52ad5d343869146edaaf2926bb78439fc470cedd9552c0490ef55eb    │
╰─────────────────┴──────────────────────────────────────────────────────────────────────╯
╭─────────────────┬──────────────────────────────────────────────────────────────────────╮
│ alias           │  xenodochial-quartz                                                  │
│ suiAddress      │  0xe7642cff223a92008d4b6bf217715d3b4dc2cb2eefc91648178579817a6287cf  │
│ publicBase64Key │  AKHVkigkJhdC6qhtAxlcLblnNdI/kZW9nA+xLJUpNgwe                        │
│ keyScheme       │  ed25519                                                             │
│ flag            │  0                                                                   │
│ peerId          │  a1d5922824261742eaa86d03195c2db96735d23f9195bd9c0fb12c9529360c1e    │
╰─────────────────┴──────────────────────────────────────────────────────────────────────╯
```

---

## Switching Wallets and Address Management

If you try to switch to an address not managed by your Sui CLI wallet, you may see an error like:

```
sui client switch --address 0x50c79fc5a29a11f3c9cbbcdc95922ee118cd44905a2ad9a8ee5616e3f4f24936
[warning] Client/Server api version mismatch, client api version : 1.51.2, server api version : 1.51.1
Address 0x50c79fc5a29a11f3c9cbbcdc95922ee118cd44905a2ad9a8ee5616e3f4f24936 not managed by wallet
```

**What this means:**

- The address you tried to switch to is not present in your Sui CLI wallet's key store.
- You need to import the private key for that address (in bech32 format) using the Sui CLI before you can use it.

---

## Summary

- Use base64 for programmatic access (JS/TS SDKs), bech32 for Sui CLI.
- Convert between formats as needed using the provided script.
- Only addresses managed by your CLI wallet can be used with `sui client switch` and other CLI commands.
