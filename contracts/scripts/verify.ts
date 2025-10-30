import { run } from "hardhat";

async function main() {
  console.log("Starting contract verification...");

  // Verify SplitFactory on Base Sepolia
  try {
    console.log("\nVerifying SplitFactory on Base Sepolia...");
    await run("verify:verify", {
      address: "0x4fd190b009fd42f7d937284d75c194911321Ad33",
      network: "baseSepolia",
    });
    console.log("✓ Base Sepolia SplitFactory verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ Base Sepolia SplitFactory already verified");
    } else {
      console.error("✗ Base Sepolia verification failed:", error.message);
    }
  }

  // Verify SplitFactory on Base Mainnet
  try {
    console.log("\nVerifying SplitFactory on Base Mainnet...");
    await run("verify:verify", {
      address: "0x0C36Eb30d21321D38B9514BB5F858c565cD680f5",
      network: "base",
    });
    console.log("✓ Base Mainnet SplitFactory verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ Base Mainnet SplitFactory already verified");
    } else {
      console.error("✗ Base Mainnet verification failed:", error.message);
    }
  }

  console.log("\n✅ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

