import { publicClient, AGENTIC_COMMERCE_ADDRESS } from './src/config.js';

async function scan() {
  const latestBlock = await publicClient.getBlockNumber();
  const CHUNK_SIZE = 9999;
  let startBlock = latestBlock - 50000n;
  if (startBlock < 0) startBlock = 0n;

  console.log("Scanning for JobCompleted from block", startBlock);

  for (let from = startBlock; from <= latestBlock; from += BigInt(CHUNK_SIZE + 1)) {
    let to = from + BigInt(CHUNK_SIZE);
    if (to > latestBlock) to = latestBlock;
    
    const logs = await publicClient.getLogs({
      address: AGENTIC_COMMERCE_ADDRESS,
      fromBlock: from,
      toBlock: to
    });

    for (const log of logs) {
        // If we don't know the topic, let's look for logs with 2 topics (topic0 + indexed jobId)
        // and data containing a bytes32 reason.
        if (log.topics.length === 2 && log.data.length === 66) {
            console.log("Possible JobCompleted log found!");
            console.log("Topic 0:", log.topics[0]);
            console.log("Job ID (topic 1):", parseInt(log.topics[1], 16));
            return;
        }
    }
  }
  console.log("No JobCompleted-like logs found.");
}
scan().catch(console.error);
