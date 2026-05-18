/// <reference types="node" />
import { 
  publicClient, 
  validatorWalletClient, 
  validatorAccount, 
  IDENTITY_REGISTRY_ADDRESS, 
  identityRegistryAbi 
} from './config.js';

let cachedAgentId: bigint | null = null;

/**
 * Initializes and registers the Agent on the on-chain IdentityRegistry if not already registered.
 * Uses environment variable AGENT_ID or memory cache.
 */
export async function initializeAgent(): Promise<bigint> {
  if (cachedAgentId) {
    return cachedAgentId;
  }

  // Check if we can fallback to env var
  if (process.env.AGENT_ID) {
    cachedAgentId = BigInt(process.env.AGENT_ID);
    console.log(`🤖 Agent Identity loaded from Environment Variable. Agent ID: ${cachedAgentId.toString()}`);
    return cachedAgentId;
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
    cachedAgentId = agentId;

    return agentId;
  } catch (error) {
    console.error("❌ On-chain Agent Registration failed. Falling back to Agent ID 1. Error:", error);
    return 1n;
  }
}
