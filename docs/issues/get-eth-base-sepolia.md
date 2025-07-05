# Issue: Need ETH on Base Sepolia Testnet for Contract Deployment

## Error Message

```
ProviderError: insufficient funds for gas * price + value: have 0 want 1060213665000
```

## Description

When trying to deploy contracts to Base Sepolia testnet, the deployment fails because the wallet address `0x8CB80b37cc7193D0f055b1189F25eB903D888D3A` has insufficient ETH to pay for gas fees.

## Required Resources

### 🪙 **ETH (Ethereum) - For Gas Fees**

- **Purpose**: Pay for transaction gas fees on Base Sepolia
- **Amount needed**: ~0.01 ETH (approximately $0.02-0.05)
- **Wallet address**: `0x8CB80b37cc7193D0f055b1189F25eB903D888D3A`
- **Cost**: Free (from testnet faucets)

### 🪙 **USDC - For Contract Testing**

- **Purpose**: Test the payment functionality in USDCReceiver contract
- **Amount needed**: Any amount (e.g., 10-100 USDC)
- **Source**: Automatically minted by MockERC20 contract after deployment
- **Cost**: Free (test tokens)

## 🚰 **Base Sepolia Faucet Options**

### **1. Official Base Faucet (Recommended)**

- **URL**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Requirements**: Coinbase account (free to create)
- **Amount**: 0.01 ETH per day
- **Process**:
  1. Visit the faucet URL
  2. Connect your Coinbase account
  3. Enter address: `0x8CB80b37cc7193D0f055b1189F25eB903D888D3A`
  4. Request ETH
  5. Wait for confirmation (usually 1-5 minutes)

### **2. Alchemy Base Sepolia Faucet**

- **URL**: https://sepoliafaucet.com/
- **Requirements**: Alchemy account (free tier available)
- **Amount**: 0.5 ETH per day
- **Process**:
  1. Create free Alchemy account
  2. Select "Base Sepolia" network
  3. Enter your wallet address
  4. Request ETH

### **3. Chainlink Faucet**

- **URL**: https://faucets.chain.link/base-sepolia
- **Requirements**: None (may require social media verification)
- **Amount**: 0.1 ETH
- **Process**: Direct faucet access

### **4. QuickNode Faucet**

- **URL**: https://faucet.quicknode.com/base/sepolia
- **Requirements**: QuickNode account (free tier available)
- **Amount**: 0.01 ETH

## 🔄 **Deployment Process After Funding**

### **Step 1: Deploy Contracts**

```bash
cd evm
npx hardhat run scripts/deploy.ts --network base-sepolia
```

**Expected costs:**

- Deploy MockERC20: ~0.002 ETH
- Deploy USDCReceiver: ~0.003 ETH
- **Total**: ~0.005 ETH

### **Step 2: Get Test USDC**

After deployment, the script automatically:

- Mints 1,000,000 USDC to deployer address
- These are test tokens (no real value)

### **Step 3: Test Payment Functionality**

```bash
npx hardhat test
```

**Expected costs per test transaction:**

- Gas fees: ~0.0001-0.001 ETH
- USDC: Whatever amount you're testing with (free test tokens)

## 💡 **Alternative: Local Testing**

If you want to test immediately without waiting for faucet funds:

```bash
cd evm
npx hardhat run scripts/deploy.ts --network hardhat
```

This uses a local blockchain with pre-funded accounts (no real ETH needed).

## 📊 **Cost Summary**

| Action                 | ETH Cost        | USDC Cost   | Real Cost    |
| ---------------------- | --------------- | ----------- | ------------ |
| Deploy MockERC20       | ~0.002 ETH      | 0           | ~$0.01       |
| Deploy USDCReceiver    | ~0.003 ETH      | 0           | ~$0.015      |
| Test payment (10 USDC) | ~0.0005 ETH     | 10 USDC     | ~$0.0025     |
| **Total for testing**  | **~0.0055 ETH** | **10 USDC** | **~$0.0275** |

## ✅ **Success Criteria**

- [ ] Wallet funded with at least 0.01 ETH on Base Sepolia
- [ ] Contracts deploy successfully to Base Sepolia
- [ ] MockERC20 mints 1M test USDC
- [ ] Payment functionality tested and working
- [ ] Ready for frontend integration

## 🚨 **Important Notes**

- **Never use real ETH on testnets** - only use faucet-provided test ETH
- **Test USDC has no real value** - it's only for testing contract functionality
- **Keep your private key secure** - even for testnet wallets
- **Faucets have rate limits** - usually 1 request per day per address

## 🔗 **Useful Links**

- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Base Documentation](https://docs.base.org/)
- [Hardhat Network Configuration](https://hardhat.org/hardhat-network/docs/reference)
- [Ethers.js Documentation](https://docs.ethers.org/)

---

**Status**: ⏳ Pending ETH funding
**Priority**: High (blocks contract deployment)
**Estimated Time**: 5-10 minutes (after getting ETH from faucet)
