import { publicClient, REPUTATION_REGISTRY_ADDRESS } from './src/config.js';

async function scan() {
  const latestBlock = await publicClient.getBlockNumber();
  const CHUNK_SIZE = 9999;
  let startBlock = latestBlock - 100000n;
  if (startBlock < 0) startBlock = 0n;

  console.log("Scanning from block", startBlock, "to", latestBlock);
  const agentIdHex = '0x' + parseInt(1).toString(16).padStart(64, '0');

  // Try topic 0x3e7c...
  for (let from = startBlock; from <= latestBlock; from += BigInt(CHUNK_SIZE + 1)) {
    let to = from + BigInt(CHUNK_SIZE);
    if (to > latestBlock) to = latestBlock;
    
    try {
      const logs = await publicClient.getLogs({
        address: REPUTATION_REGISTRY_ADDRESS,
        fromBlock: from,
        toBlock: to,
        topics: [null, agentIdHex]
      });
      if (logs.length > 0) {
        console.log("Found log for agentId=1! Topic:", logs[0].topics[0]);
        console.log("Data:", logs[0].data);
        return;
      }
    } catch (e) {}
  }
  console.log("No logs found for agentId=1 in the last 100k blocks.");
}
scan().catch(console.error);
