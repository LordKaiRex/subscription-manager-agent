import * as fs from 'fs';
import * as path from 'path';
import { 
  publicClient, 
  validatorWalletClient, 
  validatorAccount, 
  IDENTITY_REGISTRY_ADDRESS, 
  identityRegistryAbi 
} from './config.js';

const agentJsonPath = path.resolve(process.cwd(), 'data/agent.json');

function ensureDataDir() {
  const dir = path.dirname(agentJsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Initializes and registers the Agent on the on-chain IdentityRegistry if not already registered.
 * Caches the resolved agentId inside data/agent.json.
 */
export async function initializeAgent(): Promise<bigint> {
  ensureDataDir();

  if (fs.existsSync(agentJsonPath)) {
    try {
      const raw = fs.readFileSync(agentJsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.agentId) {
        console.log(`🤖 Cached Agent Identity loaded. Agent ID: ${parsed.agentId}`);
        return BigInt(parsed.agentId);
      }
    } catch (e) {
      console.error('⚠️ Failed to read data/agent.json, re-registering...', e);
    }
  }

  // If not cached, register on-chain
  if (!validatorWalletClient || !validatorAccount) {
    console.warn("⚠️ Validator wallet not fully configured. Using fallback Agent ID 1.");
    return 1n;
  }

  console.log("🤖 Agent Identity not cached. Registering on-chain via IdentityRegistry...");
  
  try {
    const metadataURI = "https://raw.githubusercontent.com/LordKaiRex/subscription-manager-agent/main/agent-metadata.json";
    
    const { request } = await publicClient.simulateContract({
      account: validatorAccount,
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: identityRegistryAbi,
      functionName: 'register',
      args: [metadataURI]
    });

    const txHash = await validatorWalletClient.writeContract(request);
    console.log(`📡 Registration transaction sent: ${txHash}. Waiting for confirmation...`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    // Transfer(address from, address to, uint256 tokenId)
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    let agentId = 1n;
    
    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === IDENTITY_REGISTRY_ADDRESS.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC
      ) {
        if (log.topics[3]) {
          agentId = BigInt(log.topics[3]);
          break;
        }
      }
    }

    console.log(`✅ On-chain registration successful! Resolved Agent ID: ${agentId.toString()}`);
    
    fs.writeFileSync(agentJsonPath, JSON.stringify({
      agentId: agentId.toString(),
      registeredAt: new Date().toISOString(),
      transactionHash: txHash
    }, null, 2), 'utf8');

    return agentId;
  } catch (error) {
    console.error("❌ On-chain Agent Registration failed. Falling back to Agent ID 1. Error:", error);
    return 1n;
  }
}
