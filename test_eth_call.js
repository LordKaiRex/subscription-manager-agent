const RPC_URL = 'https://rpc.testnet.arc.network';
const REPUTATION_REGISTRY_ADDRESS = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
const TOPIC = '0xfa9288fa4f51d543d44262550cbc1dccbc3274d3c576921beecd09551edad325';

async function testLogs() {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'eth_getLogs', params: [{ address: REPUTATION_REGISTRY_ADDRESS, topics: [TOPIC], fromBlock: '0x2880000', toBlock: 'latest' }], id: 2
      })
    });
    const json = await res.json();
    console.log("Logs:", json.result);
  } catch (e) { console.error(e); }
}

testLogs();
