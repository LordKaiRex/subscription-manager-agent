import { publicClient, REPUTATION_REGISTRY_ADDRESS } from './src/config.js';

async function check() {
  const latestBlock = await publicClient.getBlockNumber();
  console.log("Checking from block", latestBlock - 9000n);
  
  const logs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY_ADDRESS,
    fromBlock: latestBlock - 9000n,
    toBlock: 'latest'
  });
  
  console.log("Found", logs.length, "logs");
  for (const log of logs) {
    console.log("Log topics:", log.topics);
    console.log("Log data:", log.data);
  }
}
check();
