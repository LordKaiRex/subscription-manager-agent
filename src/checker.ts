import { getRenewingSoon } from './subscriptions.js';
import { executeCancellationJob } from './jobs.js';

/**
 * Checks for active subscriptions renewing within 7 days and triggers cancellation jobs for them.
 * @param agentId The registered agent's ID
 */
export async function checkAndProcessRenewals(agentId: bigint) {
  try {
    const renewingSoon = await getRenewingSoon(7);
    if (renewingSoon.length > 0) {
      console.log(`⚠️ ${renewingSoon.length} renewals detected, acting...`);
      for (const sub of renewingSoon) {
        await executeCancellationJob(sub.name, agentId);
      }
    } else {
      console.log('✅ No pending renewals detected in the next 7 days.');
    }
  } catch (error) {
    console.error('Error during renewal check:', error);
  }
}
