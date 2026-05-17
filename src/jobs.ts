import { keccak256, stringToHex } from 'viem';
import * as fs from 'fs';
import * as path from 'path';
import { 
  publicClient, 
  ownerWalletClient, 
  validatorWalletClient, 
  ownerAccount, 
  validatorAccount, 
  AGENTIC_COMMERCE_ADDRESS, 
  agenticCommerceAbi,
  USDC_ADDRESS,
  usdcAbi,
  REPUTATION_REGISTRY_ADDRESS,
  reputationRegistryAbi
} from './config.js';
import { cancelSubscription } from './subscriptions.js';

const jobsPath = path.resolve(process.cwd(), 'data/jobs.json');

function ensureDataDir() {
  const dir = path.dirname(jobsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadJobs() {
  ensureDataDir();
  if (!fs.existsSync(jobsPath)) {
    return { activeJobs: [], inProgressJobs: [] };
  }
  try {
    const raw = fs.readFileSync(jobsPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading jobs.json:', e);
    return { activeJobs: [], inProgressJobs: [] };
  }
}

export function saveJobs() {
  ensureDataDir();
  const serializedActive = Array.from(activeJobs.entries()).map(([jobId, meta]) => ({
    jobId: jobId.toString(),
    meta: {
      ...meta,
      expiredAt: meta.expiredAt ? meta.expiredAt.toString() : undefined
    }
  }));
  const serializedInProgress = Array.from(inProgressJobs.entries()).map(([subName, jobId]) => ({
    subName,
    jobId: jobId.toString()
  }));
  fs.writeFileSync(jobsPath, JSON.stringify({
    activeJobs: serializedActive,
    inProgressJobs: serializedInProgress
  }, null, 2), 'utf8');
}

// Load persisted state on startup
const initialJobs = loadJobs();
export const activeJobs = new Map<bigint, any>(
  initialJobs.activeJobs.map((item: any) => [
    BigInt(item.jobId),
    {
      ...item.meta,
      expiredAt: item.meta.expiredAt ? BigInt(item.meta.expiredAt) : undefined
    }
  ])
);

export const inProgressJobs = new Map<string, bigint>(
  initialJobs.inProgressJobs.map((item: any) => [item.subName, BigInt(item.jobId)])
);

export function watchJobs() {
  if (!validatorAccount) {
    console.warn("⚠️ No validator account configured. Cannot properly filter jobs created by this agent.");
  }
  
  console.log("👀 Watching for JobCreated events on AgenticCommerce...");
  
  publicClient.watchContractEvent({
    address: AGENTIC_COMMERCE_ADDRESS,
    abi: agenticCommerceAbi,
    eventName: 'JobCreated',
    // We only care about jobs where this agent is the provider
    args: {
      provider: validatorAccount?.address
    },
    onLogs: logs => {
      for (const log of logs) {
        const { jobId, client, provider, evaluator, expiredAt, hook } = log.args;
        if (jobId !== undefined) {
          console.log(`✅ New job detected! JobID: ${jobId.toString()}`);
          activeJobs.set(jobId, { client, provider, evaluator, expiredAt, hook });
          saveJobs();
        }
      }
    }
  });
}

/**
 * Executes the full ERC-8183 job lifecycle for a subscription cancellation.
 */
export async function executeCancellationJob(subName: string, agentId: bigint) {
  if (!ownerWalletClient || !ownerAccount || !validatorWalletClient || !validatorAccount) {
    console.error("Missing wallet configurations. Cannot execute job.");
    return;
  }

  if (inProgressJobs.has(subName) && inProgressJobs.get(subName) !== 0n) {
    console.log(`⏭️  Skipping ${subName}: Job already in progress.`);
    return;
  }

  // Mark as in-progress immediately (use 0n temporarily until we have real jobId)
  inProgressJobs.set(subName, 0n);
  saveJobs();

  try {
    const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day
    
    // 1. createJob (Owner)
    console.log(`\n[1/6] Creating Job for ${subName}...`);
    const { request: createReq, result: jobIdResult } = await publicClient.simulateContract({
      account: ownerAccount,
      address: AGENTIC_COMMERCE_ADDRESS,
      abi: agenticCommerceAbi,
      functionName: 'createJob',
      args: [
        validatorAccount.address, // provider
        ownerAccount.address,     // evaluator
        expiredAt,
        `Cancel: ${subName}`,
        '0x0000000000000000000000000000000000000000' // hook address(0)
      ]
    });
    const txHashCreate = await ownerWalletClient.writeContract(createReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashCreate });
    const jobId = jobIdResult as bigint;
    inProgressJobs.set(subName, jobId);
    saveJobs();
    console.log(`✅ Job created: ${jobId.toString()}`);

    // 2. setBudget (Validator)
    console.log(`[2/6] Setting Budget for Job ${jobId.toString()}...`);
    const budgetAmount = 1_000_000n; // 1 USDC
    const { request: budgetReq } = await publicClient.simulateContract({
      account: validatorAccount,
      address: AGENTIC_COMMERCE_ADDRESS,
      abi: agenticCommerceAbi,
      functionName: 'setBudget',
      args: [jobId, budgetAmount, '0x']
    });
    const txHashBudget = await validatorWalletClient.writeContract(budgetReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashBudget });
    console.log(`✅ Budget set (1 USDC)`);

    // 3. approve USDC (Owner)
    console.log(`[3/6] Approving USDC...`);
    const { request: approveReq } = await publicClient.simulateContract({
      account: ownerAccount,
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'approve',
      args: [AGENTIC_COMMERCE_ADDRESS, budgetAmount]
    });
    const txHashApprove = await ownerWalletClient.writeContract(approveReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashApprove });
    console.log(`✅ USDC Approved`);

    // 4. fund (Owner)
    console.log(`[4/6] Funding Job ${jobId.toString()}...`);
    const { request: fundReq } = await publicClient.simulateContract({
      account: ownerAccount,
      address: AGENTIC_COMMERCE_ADDRESS,
      abi: agenticCommerceAbi,
      functionName: 'fund',
      args: [jobId, '0x']
    });
    const txHashFund = await ownerWalletClient.writeContract(fundReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashFund });
    console.log(`✅ Job funded (USDC locked in escrow)`);

    // 5. submit (Validator)
    console.log(`[5/6] Submitting deliverable...`);
    const deliverableHash = keccak256(stringToHex(`cancelled:${subName}`));
    const { request: submitReq } = await publicClient.simulateContract({
      account: validatorAccount,
      address: AGENTIC_COMMERCE_ADDRESS,
      abi: agenticCommerceAbi,
      functionName: 'submit',
      args: [jobId, deliverableHash, '0x']
    });
    const txHashSubmit = await validatorWalletClient.writeContract(submitReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashSubmit });
    console.log(`✅ Job submitted`);

    // 6. complete (Owner)
    console.log(`[6/6] Completing Job ${jobId.toString()}...`);
    const reasonHash = keccak256(stringToHex('cancellation-verified'));
    const { request: completeReq } = await publicClient.simulateContract({
      account: ownerAccount,
      address: AGENTIC_COMMERCE_ADDRESS,
      abi: agenticCommerceAbi,
      functionName: 'complete',
      args: [jobId, reasonHash, '0x']
    });
    const txHashComplete = await ownerWalletClient.writeContract(completeReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashComplete });
    console.log(`✅ Job completed! Payment released.`);

    // 7. Mark inactive
    cancelSubscription(subName);

    // 8. recordReputation
    console.log(`[+] Recording reputation for agent...`);
    const feedbackHash = keccak256(stringToHex('subscription_cancelled'));
    const { request: repReq } = await publicClient.simulateContract({
      account: ownerAccount,
      address: REPUTATION_REGISTRY_ADDRESS,
      abi: reputationRegistryAbi,
      functionName: 'giveFeedback',
      args: [
        agentId,
        95n,    // score
        0,      // feedbackType
        'subscription_cancelled', // tag
        '',     // metadataURI
        '',     // evidenceURI
        'Successfully cancelled', // comment
        feedbackHash
      ]
    });
    const txHashRep = await ownerWalletClient.writeContract(repReq);
    await publicClient.waitForTransactionReceipt({ hash: txHashRep });
    console.log(`✅ Reputation recorded!`);

    // 9. Send Webhook Notification
    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    if (WEBHOOK_URL && WEBHOOK_URL.trim() !== '') {
      console.log(`📡 Sending cancellation webhook to ${WEBHOOK_URL}...`);
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'subscription_cancelled',
            subscription: subName,
            jobId: jobId.toString(),
            timestamp: new Date().toISOString()
          })
        });
        console.log(`✅ Webhook status: ${res.status}`);
      } catch (e) {
        console.error(`❌ Webhook failed:`, e);
      }
    }

    // Process is fully done, we can delete it from inProgress tracking
    inProgressJobs.delete(subName);
    saveJobs();

  } catch (error) {
    console.error(`❌ Error executing job for ${subName}:`, error);
    // Delete so it can be retried on next poll
    inProgressJobs.delete(subName);
    saveJobs();
  }
}
