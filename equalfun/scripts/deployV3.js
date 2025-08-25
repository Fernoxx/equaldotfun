const hre = require("hardhat");

async function main() {
  console.log("Deploying Equal.fun V3 (Uniswap V3 version) to Base...");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Base chain Uniswap V3 addresses
  const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const SWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481";
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

  // For testnet (Base Sepolia)
  if (network.name === "baseSepolia") {
    UNISWAP_V3_FACTORY = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
    POSITION_MANAGER = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2";
    SWAP_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
  }

  // Deploy Factory V3
  const Factory = await hre.ethers.getContractFactory("EqualFunFactoryV3");
  const factory = await Factory.deploy(
    UNISWAP_V3_FACTORY,
    POSITION_MANAGER,
    SWAP_ROUTER,
    WETH_ADDRESS,
    deployer.address
  );
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("Factory V3 deployed to:", factoryAddress);

  // Get Treasury address (deployed by factory)
  const treasuryAddress = await factory.treasury();
  console.log("Treasury deployed to:", treasuryAddress);

  // Verify contracts on Basescan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for Basescan to index contracts...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("Verifying Factory V3...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [
          UNISWAP_V3_FACTORY,
          POSITION_MANAGER,
          SWAP_ROUTER,
          WETH_ADDRESS,
          deployer.address
        ],
      });
    } catch (error) {
      console.log("Factory verification error:", error.message);
    }

    console.log("Verifying Treasury...");
    try {
      await hre.run("verify:verify", {
        address: treasuryAddress,
        constructorArguments: [deployer.address],
      });
    } catch (error) {
      console.log("Treasury verification error:", error.message);
    }
  }

  console.log("\nDeployment complete!");
  console.log("Factory V3:", factoryAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("\nUpdate these addresses in frontend/lib/config.ts");
  
  // Log Uniswap V3 integration info
  console.log("\n--- Uniswap V3 Integration ---");
  console.log("Factory:", UNISWAP_V3_FACTORY);
  console.log("Position Manager:", POSITION_MANAGER);
  console.log("Swap Router:", SWAP_ROUTER);
  console.log("WETH:", WETH_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });