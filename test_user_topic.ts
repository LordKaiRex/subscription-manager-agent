import { publicClient, REPUTATION_REGISTRY_ADDRESS } from './src/config.js';

async function check() {
  const latestBlock = await publicClient.getBlockNumber();
  const agentIdHex = '0x' + parseInt(1).toString(16).padStart(64, '0');
  const logs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY_ADDRESS,
    fromBlock: latestBlock - 9000n,
    toBlock: 'latest',
    topics: ['0x3e7c1f1c6b6e89dc84e418e2b5c9e6c0c2b7a4d5e8f0a1b2c3d4e5f6a7b8c9d', agentIdHex]
  });
  console.log("Found", logs.length, "logs for agentId = 1");
}
check();
