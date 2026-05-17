import * as fs from 'fs';
import * as path from 'path';

export interface Subscription {
  id: string;
  name: string;
  clientAddress: `0x${string}`;
  renewalDate: Date;
  amount: bigint;
  active: boolean;
}

const subscriptionsPath = path.resolve(process.cwd(), 'data/subscriptions.json');

function ensureDataDir() {
  const dir = path.dirname(subscriptionsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadSubscriptions(): Subscription[] {
  ensureDataDir();
  if (!fs.existsSync(subscriptionsPath)) {
    const defaultList: Subscription[] = [
      {
        id: 'sub-1',
        name: 'Netflix',
        clientAddress: '0x1234567890123456789012345678901234567890',
        renewalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        amount: 15_990_000n, // $15.99
        active: true
      },
      {
        id: 'sub-2',
        name: 'Spotify',
        clientAddress: '0x1234567890123456789012345678901234567890',
        renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        amount: 9_990_000n, // $9.99
        active: true
      },
      {
        id: 'sub-3',
        name: 'ChatGPT Plus',
        clientAddress: '0x1234567890123456789012345678901234567890',
        renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        amount: 20_000_000n, // $20.00
        active: true
      }
    ];
    saveSubscriptions(defaultList);
    return defaultList;
  }
  
  const raw = fs.readFileSync(subscriptionsPath, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.map((item: any) => ({
    ...item,
    renewalDate: new Date(item.renewalDate),
    amount: BigInt(item.amount)
  }));
}

export function saveSubscriptions(list: Subscription[]) {
  ensureDataDir();
  const serialized = list.map(item => ({
    ...item,
    renewalDate: item.renewalDate.toISOString(),
    amount: item.amount.toString()
  }));
  fs.writeFileSync(subscriptionsPath, JSON.stringify(serialized, null, 2), 'utf8');
}

/**
 * Returns subscriptions that are active and renewing within the specified number of days.
 * @param days The number of days threshold for renewals.
 */
export async function getRenewingSoon(days: number): Promise<Subscription[]> {
  const list = loadSubscriptions();
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return list.filter(sub => sub.active && sub.renewalDate <= threshold && sub.renewalDate >= now);
}

/**
 * Marks a subscription as cancelled (inactive)
 * @param subName The name of the subscription
 */
export function cancelSubscription(subName: string) {
  const list = loadSubscriptions();
  const sub = list.find(s => s.name === subName);
  if (sub) {
    sub.active = false;
    saveSubscriptions(list);
    console.log(`🛑 Subscription ${subName} marked as inactive.`);
  }
}
