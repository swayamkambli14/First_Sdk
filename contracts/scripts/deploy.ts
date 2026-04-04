import { ethers, network, run } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying BadgeNFT with account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  const BadgeNFTFactory = await ethers.getContractFactory('BadgeNFT');
  const badge = await BadgeNFTFactory.deploy(deployer.address);
  await badge.waitForDeployment();

  const contractAddress = await badge.getAddress();
  console.log(`BadgeNFT deployed to: ${contractAddress}`);

  // Write deployment info to JSON file
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: network.name,
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info saved to deployments/${network.name}.json`);
  console.log(`\nAdd to .env:\nBADGE_NFT_CONTRACT_ADDRESS=${contractAddress}`);

  // Verify on Etherscan (only for non-local networks)
  if (network.name !== 'localhost' && network.name !== 'hardhat') {
    console.log('\nWaiting 5 confirmations before Etherscan verification...');
    await badge.deploymentTransaction()?.wait(5);

    try {
      await run('verify:verify', {
        address: contractAddress,
        constructorArguments: [deployer.address],
      });
      console.log('Contract verified on Etherscan');
    } catch (err) {
      console.warn('Etherscan verification failed:', err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
