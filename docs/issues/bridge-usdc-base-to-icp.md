# Issue: Bridging USDC from Base to ICP After Smart Contract Payment

## Context

- Users pay for file uploads using USDC on Base (EVM chain).
- The payment is received by a smart contract on Base.
- After payment confirmation, the file is uploaded to the Internet Computer (ICP).
- The goal is to move (bridge) the received USDC from Base to ICP to top up the ICP canister/backend contract.

## ✅ **Update: OneSec Enables Trustless Bridging from Base to ICP**

### What is OneSec?

- **OneSec** is a decentralized, smart contract-based bridge that supports Arbitrum, Base, and Ethereum (Bitcoin and Solana planned).
- Runs on **ICP canisters** using:
  - **Threshold ECDSA** to sign EVM transactions directly from ICP.
  - **HTTP Outcalls** to read EVM chain state from multiple nodes.
- No centralized relayers required (optional for speed).

### How Bridging Works

#### a) **From EVM (Base) → ICP**

1. **Lock USDC** on EVM via OneSec's `Locker` contract.
2. This emits an on-chain event.
3. ICP's OneSec canister **fetches and verifies** that event using HTTP outcalls and consensus.
4. Once verified, **ICP mints USDC** (e.g., as `oUSDC` via ICRC1 ledger canister) to the recipient account.

#### b) **From ICP → EVM**

1. OneSec **burns** USDC on ICP.
2. Prepares a transaction to **unlock or mint** on EVM.
3. Signs the transaction with **Threshold ECDSA** on ICP.
4. Sends the signed tx to the EVM chain (optionally via relayer).
5. USDC is transferred to the EVM address.

### Advantages

- **No centralized custody.**
- **Programmable bridge logic** on both sides.
- **Fully auditable and deterministic** via on-chain events and verifiable consensus.
- Immediate **programmatic crediting** of ICP canisters.

### Recommended Flow Using OneSec

1. User pays in **USDC** into the OneSec locker contract on Base.
2. Your **ICP canister is credited automatically** once the event is validated.
3. No centralized exchange needed.
4. Your app can fully automate and verify this bridging process.

### Integration Notes

- The "main" smart contract on ICP is like a **bridge controller**: it tracks events, mints/burns tokens, and signs txs.
- Off-chain relayers are optional: **you can rely purely on-chain**, or use relayers to accelerate execution.
- Uses `icrc1` or `icrc2` tokens on the ICP side (e.g., `oUSDC`).

### ⚠️ Caveats

- You must **trust the OneSec contracts**, or audit them if needed.
- Not yet **natively integrated with ckERC20/Chain Fusion**, so these tokens are managed independently of the official DFINITY minters.
- Consider **naming tokens clearly** (e.g., `oUSDC` vs `ckUSDC`) to avoid confusion once DFINITY's version goes live.

## Summary Table

| Feature                         | OneSec                                | Chain Fusion / ckUSDC (future)               |
| ------------------------------- | ------------------------------------- | -------------------------------------------- |
| Status                          | **Live** for Arbitrum, Base, Ethereum | **Planned** for Base, partially live for ETH |
| Trust model                     | Trustless via T-ECDSA + Outcalls      | Trustless via chain-key + minters            |
| ICP-side token                  | `oUSDC` via OneSec Ledger Canister    | `ckUSDC` via DFINITY minter                  |
| Integration effort              | Low–Moderate                          | Low (once live)                              |
| Uses centralized exchange?      | **No**                                | **No**                                       |
| Custom events / logic possible? | **Yes** (on both chains)              | Partially                                    |

## Open Questions

- **Where should the bridging logic live?**
  - Should it be part of the Base smart contract, a backend service, or an ICP canister?
- **How can the bridging process be automated and secured?**
- **What bridges or protocols are recommended for moving USDC from Base to ICP?**
- **How to ensure funds are reliably credited to the ICP backend?**

## Desired Flow

1. User pays USDC to Base smart contract.
2. Payment is confirmed on Base.
3. File is uploaded to ICP.
4. USDC is bridged from Base to ICP to top up the canister/backend.

## Challenges

- No direct, native bridge between Base and ICP for USDC (as of now).
- Bridging may require a third-party service or manual process.
- Security and reliability of the bridge are critical.
- Need to track and verify successful bridging and crediting on ICP.

## Questions for Base/ICP/Docs AI

- What is the best practice for automating USDC bridging from Base to ICP?
- Are there any recommended bridges or protocols?
- Should the withdrawal/bridging be triggered by the smart contract, backend, or canister?
- How to handle failures or delays in the bridging process?

## References

- [Base Documentation](https://docs.base.org/)
- [ICP Documentation](https://internetcomputer.org/docs/current/developer-docs/)
- [Bridging Solutions (general)](https://chain.link/solutions/cross-chain)
- [OneSec Bridge](https://github.com/one-sec-bridge)

---

**Status:** Open
**Priority:** High for production payment flows
