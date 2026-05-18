const RPC_URL = 'https://rpc.testnet.arc.network';
const REPUTATION_REGISTRY_ADDRESS = '0x8004B663056A597Dffe9eCcC1965A193B7388713';

async function testSelector(sel) {
  const repCallData = sel + parseInt(1).toString(16).padStart(64, '0') + parseInt(0).toString(16).padStart(64, '0');
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'eth_call', params: [{ to: REPUTATION_REGISTRY_ADDRESS, data: repCallData }, 'latest'], id: 2
      })
    });
    const json = await res.json();
    console.log(sel, "result:", json.result || json.error);
  } catch (e) { console.error(e); }
}

testSelector('0x5a9b0b89'); // getFeedback(uint256,uint256) user's
testSelector('0x2d150457'); // getFeedback(uint256,uint256) computed
testSelector('0x1b80acc2'); // agentFeedbacks(uint256,uint256)
testSelector('0x8cd8336d'); // feedbacks(uint256,uint256)
testSelector('0x2e0bb161'); // feedbacks(uint256) maybe?
