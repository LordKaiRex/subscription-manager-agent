const AGENTIC_COMMERCE_ADDRESS = '0x0747EEf0706327138c69792bF28Cd525089e4583';
const RPC_URL = 'https://rpc.testnet.arc.network';
const TOPIC_JOB_CREATED = '0xb0f0239bfdd96453e24733e18bfc24b70d8fadf123dd977473518dd577ee79b9';
const TOPIC_JOB_COMPLETED = '0x45c386dc6524a2d9fe630455323c6a39f557c52ab01e886deee20a0b538147ac';

const fetchLogs = async (address, topics) => {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      // using a recent block to bypass range limit for testing
      params: [{ address, topics, fromBlock: '0x2880000', toBlock: 'latest' }],
      id: 1
    })
  });
  const data = await res.json();
  return data.result || [];
};

async function run() {
  const comp = await fetchLogs(AGENTIC_COMMERCE_ADDRESS, [TOPIC_JOB_COMPLETED]);
  console.log("JobCompleted logs:", comp);
}
run();
