export interface Subscription {
  id: string;
  name: string;
  clientAddress: `0x${string}`;
  renewalDate: Date;
  amount: bigint;
  active: boolean;
}

// In-memory array of subscriptions
export const subscriptions: Subscription[] = [
  // Mock subscription renewing in 2 days for testing
  {
    id: 'sub-1',
    name: 'Netflix',
    clientAddress: '0x1234567890123456789012345678901234567890',
    renewalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 
    amount: 10_000_000n, // 10 USDC (6 decimals)
    active: true
  }
];

/**
 * Returns subscriptions that are active and renewing within the specified number of days.
 * @param days The number of days threshold for renewals.
 */
export async function getRenewingSoon(days: number): Promise<Subscription[]> {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return subscriptions.filter(sub => sub.active && sub.renewalDate <= threshold && sub.renewalDate >= now);
}

/**
 * Marks a subscription as cancelled (inactive)
 * @param subName The name of the subscription
 */
export function cancelSubscription(subName: string) {
  const sub = subscriptions.find(s => s.name === subName);
  if (sub) {
    sub.active = false;
    console.log(`🛑 Subscription ${subName} marked as inactive.`);
  }
}
