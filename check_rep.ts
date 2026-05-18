import { publicClient, ownerAccount, REPUTATION_REGISTRY_ADDRESS } from './src/config.js';

async function check() {
  const latestBlock = await publicClient.getBlockNumber();
  console.log("Checking from block", latestBlock - 5000n);
  
  // Find all transactions from the owner
  // Better yet, just fetch logs for ReputationRegistry FeedbackGiven event!
  const logs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY_ADDRESS,
    fromBlock: latestBlock - 50000n,
    toBlock: 'latest'
  });
  
  console.log("Found", logs.length, "logs on ReputationRegistry");
  for (const log of logs) {
    console.log("Log:", log.topics);
  }
}
check();
