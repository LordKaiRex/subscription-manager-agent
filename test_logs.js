const AGENTIC_COMMERCE_ADDRESS = '0x0747EEf0706327138c69792bF28Cd525089e4583';
const RPC_URL = 'https://rpc.testnet.arc.network';
const TOPIC_JOB_CREATED = '0xb0f0239bfdd96453e24733e18bfc24b70d8fadf123dd977473518dd577ee79b9';

const fetchLogs = async (address, topics) => {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [{ address, topics, fromBlock: '0x0', toBlock: 'latest' }],
      id: 1
    })
  });
  const data = await res.json();
  console.log("Logs fetched:", data);
  return data.result || [];
};

fetchLogs(AGENTIC_COMMERCE_ADDRESS, [TOPIC_JOB_CREATED]);
