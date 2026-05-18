import { publicClient, REPUTATION_REGISTRY_ADDRESS } from './src/config.js';

async function scan() {
  const latestBlock = await publicClient.getBlockNumber();
  const logs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY_ADDRESS,
    fromBlock: latestBlock - 5000n,
    toBlock: 'latest'
  });
  console.log(`Found ${logs.length} logs total on ReputationRegistry.`);
  for (const l of logs) {
    if (l.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000001') {
      console.log("Topic 0 for agentId=1:", l.topics[0]);
      console.log("Data:", l.data);
    }
  }
}
scan().catch(console.error);
