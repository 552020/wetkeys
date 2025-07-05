import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// 1. Compile contracts
console.log("🔨 Compiling contracts...");
execSync("npx hardhat compile", { stdio: "inherit" });

// 2. Copy ABI
const artifactPath = path.resolve(__dirname, "../artifacts/contracts/USDCReceiver.sol/USDCReceiver.json");
const abiDestPath = path.resolve(__dirname, "../../src/vtk_frontend/src/abi/USDCReceiver.json");

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.mkdirSync(path.dirname(abiDestPath), { recursive: true });
fs.writeFileSync(abiDestPath, JSON.stringify(artifact.abi, null, 2));

console.log("✅ Compiled contracts and copied USDCReceiver ABI to frontend:", abiDestPath);
