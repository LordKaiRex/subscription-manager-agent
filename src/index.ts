import { getRenewingSoon } from './subscriptions.js';
import { watchJobs, executeCancellationJob } from './jobs.js';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

console.log('🚀 Starting subscription-manager-agent...');
console.log(`Polling every ${POLL_INTERVAL_MS / 1000} seconds on Arc Testnet.`);

// Start watching for JobCreated events
watchJobs();

// Initial run
(async () => {
  try {
    const renewingSoon = await getRenewingSoon(7);
    if (renewingSoon.length > 0) {
      console.log(`⚠️ ${renewingSoon.length} renewals detected, acting...`);
      for (const sub of renewingSoon) {
        // We assume an agentId of 1n for demonstration purposes
        await executeCancellationJob(sub.name, 1n);
      }
    }
  } catch (error) {
    console.error('Error during initial poll:', error);
  }
})();

setInterval(async () => {
  try {
    const renewingSoon = await getRenewingSoon(7);
    if (renewingSoon.length > 0) {
      console.log(`⚠️ ${renewingSoon.length} renewals detected, acting...`);
      for (const sub of renewingSoon) {
        await executeCancellationJob(sub.name, 1n);
      }
    }
  } catch (error) {
    console.error('Error during polling:', error);
  }
}, POLL_INTERVAL_MS);
