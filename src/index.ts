import { watchJobs } from './jobs.js';
import { initializeAgent } from './agent.js';
import { checkAndProcessRenewals } from './checker.js';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

console.log('🚀 Starting subscription-manager-agent...');

// Initial boot
(async () => {
  try {
    const agentId = await initializeAgent();
    console.log(`Polled with Agent ID: ${agentId.toString()} every ${POLL_INTERVAL_MS / 1000} seconds on Arc Testnet.`);

    // Start watching for JobCreated events
    watchJobs();

    // Initial run
    await checkAndProcessRenewals(agentId);

    // Interval run
    setInterval(async () => {
      await checkAndProcessRenewals(agentId);
    }, POLL_INTERVAL_MS);

  } catch (err) {
    console.error('❌ Failed to boot subscription agent:', err);
  }
})();
