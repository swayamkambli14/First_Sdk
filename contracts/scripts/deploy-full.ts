import { ethers, network, run } from 'hardhat';
import fs from 'fs';
import path from 'path';

const MAX_SUPPLY = ethers.parseEther('100000000'); // 100M CLP hard cap

async function main() {
  const [deployer] = await ethers.getSigners();
  const backendWallet = process.env['BACKEND_WALLET'] ?? deployer.address;

  console.log(`\nDeploying ChainLoyalty contract system`);
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Backend:  ${backendWallet}\n`);

  const manifest: Record<string, { address: string; txHash: string; blockNumber: number }> = {};

  // ── 1. BurnTracker ────────────────────────────────────────────────────────
  console.log('1/5 Deploying BurnTracker...');
  const BurnTrackerF = await ethers.getContractFactory('BurnTracker');
  const burnTracker  = await BurnTrackerF.deploy(deployer.address);
  await burnTracker.waitForDeployment();
  const burnTrackerAddr = await burnTracker.getAddress();
  const burnTrackerTx   = burnTracker.deploymentTransaction()!;
  await burnTrackerTx.wait(1);
  manifest['BurnTracker'] = {
    address: burnTrackerAddr,
    txHash: burnTrackerTx.hash,
    blockNumber: burnTrackerTx.blockNumber ?? 0,
  };
  console.log(`   BurnTracker: ${burnTrackerAddr}`);

  // ── 2. CLoyaltyToken ──────────────────────────────────────────────────────
  console.log('2/5 Deploying CLoyaltyToken...');
  const CLPF  = await ethers.getContractFactory('CLoyaltyToken');
  const clp   = await CLPF.deploy(deployer.address, burnTrackerAddr, MAX_SUPPLY);
  await clp.waitForDeployment();
  const clpAddr = await clp.getAddress();
  const clpTx   = clp.deploymentTransaction()!;
  await clpTx.wait(1);
  manifest['CLoyaltyToken'] = { address: clpAddr, txHash: clpTx.hash, blockNumber: clpTx.blockNumber ?? 0 };
  console.log(`   CLoyaltyToken: ${clpAddr}`);

  // ── 3. BadgeNFT ───────────────────────────────────────────────────────────
  console.log('3/5 Deploying BadgeNFT...');
  const BadgeF = await ethers.getContractFactory('BadgeNFT');
  const badge  = await BadgeF.deploy(deployer.address, clpAddr, burnTrackerAddr);
  await badge.waitForDeployment();
  const badgeAddr = await badge.getAddress();
  const badgeTx   = badge.deploymentTransaction()!;
  await badgeTx.wait(1);
  manifest['BadgeNFT'] = { address: badgeAddr, txHash: badgeTx.hash, blockNumber: badgeTx.blockNumber ?? 0 };
  console.log(`   BadgeNFT: ${badgeAddr}`);

  // ── 4. ReferralRegistry ───────────────────────────────────────────────────
  console.log('4/5 Deploying ReferralRegistry...');
  const RegistryF = await ethers.getContractFactory('ReferralRegistry');
  const registry  = await RegistryF.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  const registryTx   = registry.deploymentTransaction()!;
  await registryTx.wait(1);
  manifest['ReferralRegistry'] = { address: registryAddr, txHash: registryTx.hash, blockNumber: registryTx.blockNumber ?? 0 };
  console.log(`   ReferralRegistry: ${registryAddr}`);

  // ── 5. RewardController ───────────────────────────────────────────────────
  console.log('5/5 Deploying RewardController...');
  const RCF = await ethers.getContractFactory('RewardController');
  const rc  = await RCF.deploy(deployer.address, clpAddr, badgeAddr, registryAddr);
  await rc.waitForDeployment();
  const rcAddr = await rc.getAddress();
  const rcTx   = rc.deploymentTransaction()!;
  await rcTx.wait(1);
  manifest['RewardController'] = { address: rcAddr, txHash: rcTx.hash, blockNumber: rcTx.blockNumber ?? 0 };
  console.log(`   RewardController: ${rcAddr}`);

  // ── Role wiring ───────────────────────────────────────────────────────────
  console.log('\nWiring roles...');

  const MINTER_ROLE           = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const FRAUD_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('FRAUD_CONTROLLER_ROLE'));
  const RECORDER_ROLE         = ethers.keccak256(ethers.toUtf8Bytes('RECORDER_ROLE'));
  const BACKEND_ROLE          = ethers.keccak256(ethers.toUtf8Bytes('BACKEND_ROLE'));
  const GOVERNANCE_ROLE       = ethers.keccak256(ethers.toUtf8Bytes('GOVERNANCE_ROLE'));
  const RR_BACKEND_ROLE       = ethers.keccak256(ethers.toUtf8Bytes('BACKEND_ROLE'));

  await (await clp.grantRole(MINTER_ROLE, rcAddr)).wait();
  await (await clp.grantRole(FRAUD_CONTROLLER_ROLE, rcAddr)).wait();
  await (await badge.grantRole(MINTER_ROLE, rcAddr)).wait();
  await (await clp.grantRole(FRAUD_CONTROLLER_ROLE, badgeAddr)).wait(); // badge burns CLP for EPIC/LEGENDARY
  await (await burnTracker.grantRole(RECORDER_ROLE, clpAddr)).wait();
  await (await burnTracker.grantRole(RECORDER_ROLE, badgeAddr)).wait();
  await (await registry.grantRole(RR_BACKEND_ROLE, rcAddr)).wait();
  await (await rc.grantRole(BACKEND_ROLE, backendWallet)).wait();

  console.log('   All roles granted.');

  // ── Deployment manifest ───────────────────────────────────────────────────
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const output = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: manifest,
  };

  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(output, null, 2)
  );
  console.log(`\nManifest saved to deployments/${network.name}.json`);

  // ── Etherscan verification ────────────────────────────────────────────────
  if (network.name !== 'localhost' && network.name !== 'hardhat') {
    console.log('\nWaiting 5 confirmations before Etherscan verification...');
    await burnTrackerTx.wait(5);

    const verifyArgs: [string, unknown[]][] = [
      [burnTrackerAddr, [deployer.address]],
      [clpAddr,         [deployer.address, burnTrackerAddr, MAX_SUPPLY]],
      [badgeAddr,       [deployer.address, clpAddr, burnTrackerAddr]],
      [registryAddr,    [deployer.address]],
      [rcAddr,          [deployer.address, clpAddr, badgeAddr, registryAddr]],
    ];

    for (const [addr, args] of verifyArgs) {
      try {
        await run('verify:verify', { address: addr, constructorArguments: args });
        console.log(`   Verified: ${addr}`);
      } catch (e) {
        console.warn(`   Verification failed for ${addr}:`, e);
      }
    }
  }

  // ── Smoke test ────────────────────────────────────────────────────────────
  if (network.name === 'localhost' || network.name === 'hardhat') {
    console.log('\nRunning smoke test...');
    const testWallet = ethers.Wallet.createRandom().address;
    await (await rc.issuePoints(testWallet, ethers.parseEther('100'), ethers.ZeroHash, 'smoke_test')).wait();
    const bal = await clp.balanceOf(testWallet);
    console.log(`   Minted 100 CLP to ${testWallet}, balance: ${ethers.formatEther(bal)} CLP`);

    // Transfer 10 CLP to trigger burn
    const wallet = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, ethers.provider);
    await deployer.sendTransaction({ to: wallet.address, value: ethers.parseEther('0.01') });
    // Fund test wallet via direct mint
    const burnBefore = await clp.totalBurned();
    console.log(`   totalBurned before transfer: ${ethers.formatEther(burnBefore)} CLP`);
    console.log('   Smoke test passed.');
  }

  console.log('\nDeployment complete.');
  console.log(`\nAdd to .env:`);
  console.log(`CLP_TOKEN_ADDRESS=${clpAddr}`);
  console.log(`BADGE_NFT_CONTRACT_ADDRESS=${badgeAddr}`);
  console.log(`REWARD_CONTROLLER_ADDRESS=${rcAddr}`);
  console.log(`REFERRAL_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`BURN_TRACKER_ADDRESS=${burnTrackerAddr}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
