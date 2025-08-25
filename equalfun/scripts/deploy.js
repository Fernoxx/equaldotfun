const hre = require("hardhat");

async function main() {
  console.log("Deploying Equal.fun contracts to Base...");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Base chain addresses
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"; // WETH on Base
  const AERODROME_ROUTER = "0x827922686190790b37229fd06084350E74485b72"; // Aerodrome Router on Base

  // Deploy Factory
  const Factory = await hre.ethers.getContractFactory("EqualFunFactory");
  const factory = await Factory.deploy(
    WETH_ADDRESS,
    AERODROME_ROUTER,
    deployer.address
  );
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);

  // Get Treasury address (deployed by factory)
  const treasuryAddress = await factory.treasury();
  console.log("Treasury deployed to:", treasuryAddress);

  // Verify contracts on Basescan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for Basescan to index contracts...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("Verifying Factory...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [WETH_ADDRESS, AERODROME_ROUTER, deployer.address],
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
  console.log("Factory:", factoryAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("\nUpdate these addresses in frontend/lib/config.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });