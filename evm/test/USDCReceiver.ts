import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("USDCReceiver", () => {
  it("should accept USDC payment and emit event", async () => {
    const [deployer, user] = await ethers.getSigners();

    // Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USD Coin", "USDC", 6);
    await usdc.mint(user.address, 1000_000); // 1000 USDC

    // Deploy payment contract
    const USDCReceiver = await ethers.getContractFactory("USDCReceiver");
    const receiver = await USDCReceiver.deploy(await usdc.getAddress());

    // Connect as user and approve - cast to any to avoid TypeScript issues
    const userUSDC = usdc.connect(user) as any;
    await userUSDC.approve(await receiver.getAddress(), 500_000); // 500 USDC

    // Pay for file - cast to any to avoid TypeScript issues
    const tx = await (receiver.connect(user) as any).payForFile("file123", 500_000);

    // Check event
    await expect(tx).to.emit(receiver, "PaymentReceived").withArgs(user.address, "file123", 500_000, anyValue);
  });

  it("should revert on zero amount", async () => {
    const [user] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USD Coin", "USDC", 6);
    const USDCReceiver = await ethers.getContractFactory("USDCReceiver");
    const receiver = await USDCReceiver.deploy(await usdc.getAddress());

    await expect((receiver.connect(user) as any).payForFile("fileX", 0)).to.be.revertedWith(
      "Amount must be greater than 0"
    );
  });
});
