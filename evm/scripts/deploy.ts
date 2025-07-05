import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0xf175520C52418dfE19C8098071a252da48Cd1C19"; // Base Sepolia

  const Contract = await ethers.getContractFactory("USDCReceiver");
  const deployed = await Contract.deploy(USDC_ADDRESS);

  await deployed.waitForDeployment();

  console.log("USDCReceiver deployed to:", await deployed.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
