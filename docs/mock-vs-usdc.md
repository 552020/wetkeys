# MockERC20 vs Real USDC: Key Differences and Usage

## What is MockERC20?

- **MockERC20** is a test version of an ERC20 token contract.
- It is deployed locally or on testnets for development and testing purposes.
- You can mint unlimited tokens to any address for free.
- It is not backed by any real asset and has no real-world value.
- Used to simulate USDC or any ERC20 token in a safe, controlled environment.

## What is USDC?

- **USDC (USD Coin)** is a real, regulated, fiat-backed stablecoin issued by Circle.
- It is deployed on mainnet and testnets by Circle, with a fixed contract address per network.
- USDC is widely used in DeFi, payments, and as a stable store of value.
- On testnets, USDC is still controlled by Circle, but tokens have no real-world value.
- On mainnet, USDC is redeemable 1:1 for US dollars (with KYC and Circle's terms).

## Key Differences

| Feature      | MockERC20               | USDC (Testnet/Mainnet)         |
| ------------ | ----------------------- | ------------------------------ |
| **Purpose**  | Testing, development    | Real payments, production      |
| **Issuer**   | You (deployed by devs)  | Circle (official)              |
| **Minting**  | Unlimited, by anyone    | Only by Circle                 |
| **Value**    | No real value           | Testnet: no value, Mainnet: $1 |
| **Address**  | Random/testnet          | Fixed, official                |
| **Security** | No audits, for dev only | Audited, regulated             |
| **Risk**     | None (test only)        | Mainnet: real money at risk    |

## When to Use Each

- **MockERC20:**
  - Local development
  - Automated tests
  - Early-stage testnet deployments
  - When you need to mint tokens freely
- **USDC (Testnet):**
  - Integration testing with real USDC contract
  - Simulating production flows
  - Preparing for mainnet launch
- **USDC (Mainnet):**
  - Real payments
  - Production deployments
  - When handling real user funds

## Risks and Best Practices

- **Never use MockERC20 in production!**
- **Never send real USDC to a MockERC20 contract address.**
- Always verify the USDC contract address on the correct network ([Base Sepolia](https://sepolia.basescan.org/), [Base Mainnet](https://basescan.org/)).
- For production, always use the official USDC address provided by Circle.

## Example Addresses

| Network       | MockERC20 (example)                        | USDC (official)                            |
| ------------- | ------------------------------------------ | ------------------------------------------ |
| Local/Hardhat | 0x... (random)                             | N/A                                        |
| Base Sepolia  | 0xB469BeD842eA1760cC4b85087b7623a10289Ef2A | 0xf175520C52418dfE19C8098071a252da48Cd1C19 |
| Base Mainnet  | (do not use)                               | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |

## References

- [USDC on Base (official docs)](https://docs.base.org/base-contracts)
- [Circle USDC](https://www.circle.com/en/usdc)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
