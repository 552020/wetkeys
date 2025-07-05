## ✅ HIGH-LEVEL TODO: Pay-to-Upload Flow

### 🔹 1. **Smart Contract on Base**

- [x] Create `evm/` directory for EVM contract logic
- [x] Install Hardhat + dependencies in `evm/`
- [x] Write and test a **Payment contract** (accepts USDC)
- [x] Use **USDC contract address on Base** (testnet/mainnet)
- [x] Emit events (e.g. `PaymentReceived(fileId, payer, amount)`)
- [ ] Add optional logic for fileId hash, access control, or payment reason
- [x] Write deployment script (`deploy.ts`)
- [ ] Deploy to Base **Sepolia** (testnet)

---

### 🔹 2. **Frontend Integration (ICP + Base)**

In `src/vtk_frontend`:

- [ ] Add `ethers.js` or `wagmi` for smart contract interaction
- [ ] Connect wallet via **Privy SDK** (or MetaMask for dev)
- [ ] Build a `payThenUpload(file)` function:

  - [ ] Trigger contract call on Base (send USDC)
  - [ ] Wait for tx confirmation
  - [ ] On success → call ICP canister to upload file

Optional:

- [ ] Show tx status / spinner
- [ ] Error handling if payment fails
- [ ] Abstract payment logic into a reusable hook (`usePayment()`)

---

### 🔹 3. **ICP Backend (upload trigger)**

In `vtk_backend` Rust:

- [ ] Expose method `upload_paid_file(file_id, file_metadata, chunk?)`
- [ ] Validate upload conditions (e.g. was payment confirmed)
- [ ] Register file in ICP memory and send to Walrus
- [ ] Store metadata (linked to `file_id`, timestamp, uploader)

---

### 🔹 4. **ICP ↔ Base Communication (Trust Layer)**

If you need to **verify on-chain payment on ICP**:

- [ ] Add a backend service to monitor Base chain events (`PaymentReceived`)
- [ ] Use `ethers.js` or a webhook server to **push file_id unlocks** to ICP
- [ ] (Optional) Use indexing service like Covalent or The Graph

Alternative: trust the frontend to only call upload after payment.

---

### 🔹 5. **Circle Integration (Optional, for smoother UX)**

Only if you want to:

- Sponsor gas with **Circle Paymaster**
- Accept multichain USDC (e.g., via **CCTP**)

Then:

- [ ] Add Circle SDK for **Paymaster** and/or **Wallets**
- [ ] Replace raw tx with **ERC-4337 UserOperation**
- [ ] Ensure user pays gas in USDC, or dApp sponsors it

---

### 🔹 6. **UI + Final Touches**

- [ ] Turn upload button into "Pay & Upload"
- [ ] Show USDC balance (optional)
- [ ] File list: mark files as **pending upload** or **paid**
- [ ] Add loading indicators, success messages, errors
- [ ] Add unit tests (especially on smart contract)

---

## 🧾 Final Checklist

| Task                                 | Status |
| ------------------------------------ | ------ |
| `evm/` project scaffolded            | \[ ]   |
| Payment contract written & tested    | \[ ]   |
| Contract deployed to Base testnet    | \[ ]   |
| Payment logic integrated in frontend | \[ ]   |
| ICP backend accepts file upload call | \[ ]   |
| Payment flow triggers upload         | \[ ]   |
| Circle Paymaster (optional)          | \[ ]   |
| UI polished                          | \[ ]   |
| Test end-to-end                      | \[ ]   |

---

Let me know if you want a GitHub-style issue breakdown or want to prioritize by estimated difficulty/impact.
