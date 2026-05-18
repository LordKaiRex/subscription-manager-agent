const RPC_URL = 'https://rpc.testnet.arc.network';

const run = async () => {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    });
    const data = await res.json();
    console.log("Data:", data);
  } catch (e) {
    console.error(e);
  }
};
run();
