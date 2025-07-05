import { ethers } from "hardhat";

// USDC contract addresses on Base
const USDC_ADDRESSES = {
  // Base Sepolia Testnet
  "base-sepolia": "0xf175520C52418dfE19C8098071a252da48Cd1C19", // USDC on Base Sepolia
  // Base Mainnet
  "base-mainnet": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base Mainnet
};

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;

  console.log(`Deploying contracts to ${networkName}...`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  let usdcAddress: string;
  let mockUSDC: any = null;

  // Determine if we're on testnet or mainnet
  if (networkName === "base-sepolia" || networkName === "sepolia") {
    console.log("🔧 Using MockERC20 for testing on Base Sepolia...");

    // Deploy MockERC20 for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log("MockERC20 deployed to:", usdcAddress);

    // Mint some tokens to the deployer for testing
    await mockUSDC.mint(deployer.address, 1000000_000); // 1M USDC
    console.log("Minted 1M USDC to deployer for testing");
  } else if (networkName === "base-mainnet" || networkName === "mainnet") {
    console.log("🚀 Using real USDC for production on Base Mainnet...");
    usdcAddress = USDC_ADDRESSES["base-mainnet"];
    console.log("Using USDC address:", usdcAddress);
  } else {
    console.log("🔧 Using MockERC20 for local testing...");

    // Deploy MockERC20 for local testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log("MockERC20 deployed to:", usdcAddress);

    // Mint some tokens to the deployer for testing
    await mockUSDC.mint(deployer.address, 1000000_000); // 1M USDC
    console.log("Minted 1M USDC to deployer for testing");
  }

  // Deploy USDCReceiver with the USDC address
  const USDCReceiver = await ethers.getContractFactory("USDCReceiver");
  const receiver = await USDCReceiver.deploy(usdcAddress);
  await receiver.waitForDeployment();
  console.log("USDCReceiver deployed to:", await receiver.getAddress());

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("Network:", networkName);
  console.log("USDC Address:", usdcAddress);
  console.log("USDCReceiver:", await receiver.getAddress());
  console.log("Deployer:", deployer.address);

  if (mockUSDC) {
    console.log("MockERC20:", await mockUSDC.getAddress());
    console.log("\n⚠️  NOTE: Using MockERC20 for testing. For production, use real USDC.");
  } else {
    console.log("\n✅ Using real USDC contract for production deployment.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
