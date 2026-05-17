import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';
import { loadSubscriptions, saveSubscriptions, cancelSubscription, Subscription } from './subscriptions.js';
import { executeCancellationJob, loadJobs } from './jobs.js';
import { checkAndProcessRenewals } from './checker.js';
import { initializeAgent } from './agent.js';
import { ownerAccount, validatorAccount, reinitializeConfig } from './config.js';

const app = express();
const PORT = 3001;

// Override global Express JSON serialization to handle BigInts cleanly
app.set('json replacer', (key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
);

app.use(cors());
app.use(express.json());

let agentId = 1n;

// Initialize agent configuration
(async () => {
  try {
    agentId = await initializeAgent();
    console.log(`🤖 Express server loaded with Agent ID: ${agentId.toString()}`);
  } catch (err) {
    console.error("❌ Failed to initialize agent in server:", err);
  }
})();

// Circle API Helper
async function callCircleAPI(method: string, path: string, body?: any, userToken?: string) {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey || apiKey === 'YOUR_CIRCLE_API_KEY_HERE') {
    throw new Error('Circle API Key is not configured in .env');
  }

  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  if (userToken) {
    headers['X-User-Token'] = userToken;
  }

  const url = `https://api.circle.com${path}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Circle API Error [${method} ${path}]:`, errText);
    throw new Error(`Circle API returned status ${response.status}: ${errText}`);
  }

  return response.json();
}

// POST /auth/init - initializes or retrieves a Circle wallet session
app.post('/auth/init', async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) {
      res.status(400).json({ error: 'Missing userEmail' });
      return;
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    const appId = process.env.CIRCLE_APP_ID || '';

    // Alphanumeric deterministic user identifier
    const userId = createHash('sha256').update(userEmail.toLowerCase()).digest('hex');

    // Safe fallback for offline simulation mode
    if (!apiKey || apiKey.trim() === '') {
      console.log(`⚠️ CIRCLE_API_KEY not configured. Simulating Circle Wallet initialization for ${userEmail}...`);
      
      // Determine if a mock wallet already exists in localStorage or simulate a new creation
      const mockChallengeId = `mock-challenge-id-${userId.substring(0, 8)}`;
      res.json({
        simulated: true,
        userToken: `mock-user-token-${userId.substring(0, 10)}`,
        encryptionKey: 'mock-encryption-key-for-submanager',
        appId: appId || 'mock-app-id',
        challengeId: mockChallengeId, // Always simulate PIN setup on first run
        walletAddress: null
      });
      return;
    }

    // 1. Create a Circle W3S User record. Catch 409 Conflict gracefully
    try {
      await callCircleAPI('POST', '/v1/w3s/users', { userId });
      console.log(`👤 Circle User created: ${userId}`);
    } catch (e: any) {
      console.log(`ℹ️ Circle User registration skipped (already exists): ${e.message}`);
    }

    // 2. Generate the User Session Token & Encryption Key
    const tokenRes = await callCircleAPI('POST', '/v1/w3s/users/token', { userId });
    const { userToken, encryptionKey } = tokenRes.data;

    // 3. Query existing wallets associated with this session token
    const walletsRes = await callCircleAPI('GET', '/v1/w3s/wallets', undefined, userToken);
    const wallets = walletsRes.data?.wallets || [];

    if (wallets.length > 0) {
      console.log(`💼 Existing Circle Wallet found for ${userEmail}: ${wallets[0].address}`);
      res.json({
        userToken,
        encryptionKey,
        appId,
        challengeId: null,
        walletAddress: wallets[0].address
      });
    } else {
      // 4. Initialize User to trigger wallet creation challenge via Web SDK
      console.log(`🔑 Initializing new user-controlled wallet challenge for ${userEmail}...`);
      const initRes = await callCircleAPI('POST', '/v1/w3s/user/initialize', {
        idempotencyKey: randomUUID(),
        blockchains: ['ARC-TESTNET']
      }, userToken);

      const { challengeId } = initRes.data;
      res.json({
        userToken,
        encryptionKey,
        appId,
        challengeId,
        walletAddress: null
      });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/wallet - fetches wallet address after SDK challenge succeeds
app.post('/auth/wallet', async (req, res) => {
  try {
    const { userToken } = req.body;
    if (!userToken) {
      res.status(400).json({ error: 'Missing userToken' });
      return;
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.log(`⚠️ CIRCLE_API_KEY not configured. Simulating wallet retrieval...`);
      res.json({
        walletAddress: '0x6e6B69D686E61Cc8b851C8e3721dF9C6Ef002DD0',
        walletId: 'mock-wallet-id',
        blockchain: 'ARC-TESTNET'
      });
      return;
    }

    const walletsRes = await callCircleAPI('GET', '/v1/w3s/wallets', undefined, userToken);
    const wallets = walletsRes.data?.wallets || [];

    if (wallets.length === 0) {
      res.status(404).json({ error: 'No wallet found for this user session' });
      return;
    }

    res.json({
      walletAddress: wallets[0].address,
      walletId: wallets[0].id,
      blockchain: 'ARC-TESTNET'
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /agent - returns agent metadata
app.get('/agent', (req, res) => {
  res.json({
    agentId: agentId.toString(),
    ownerAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
    validatorAddress: validatorAccount?.address || '0x0000000000000000000000000000000000000000'
  });
});

// GET /subscriptions - returns all subscriptions from the JSON store
app.get('/subscriptions', (req, res) => {
  try {
    const list = loadSubscriptions();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /jobs - returns persisted jobs metadata (for history description stitching)
app.get('/jobs', (req, res) => {
  try {
    const data = loadJobs();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /setup-keys - hot-reloads private keys into .env and memory
app.post('/setup-keys', async (req, res) => {
  try {
    const { ownerKey, validatorKey } = req.body;

    // Validation: must be valid 0x-prefixed 64-char hex strings (length 66)
    const hexRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!ownerKey || !hexRegex.test(ownerKey)) {
      res.status(400).json({ error: 'Owner Key must be a valid 0x-prefixed 64-character hex string' });
      return;
    }
    if (!validatorKey || !hexRegex.test(validatorKey)) {
      res.status(400).json({ error: 'Validator Key must be a valid 0x-prefixed 64-character hex string' });
      return;
    }

    // 1. Write back to .env preserving other config variables like WEBHOOK_URL
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split(/\r?\n/);
    let ownerUpdated = false;
    let validatorUpdated = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('OWNER_PRIVATE_KEY=')) {
        lines[i] = `OWNER_PRIVATE_KEY=${ownerKey}`;
        ownerUpdated = true;
      }
      if (lines[i].startsWith('VALIDATOR_PRIVATE_KEY=')) {
        lines[i] = `VALIDATOR_PRIVATE_KEY=${validatorKey}`;
        validatorUpdated = true;
      }
    }

    if (!ownerUpdated) lines.push(`OWNER_PRIVATE_KEY=${ownerKey}`);
    if (!validatorUpdated) lines.push(`VALIDATOR_PRIVATE_KEY=${validatorKey}`);

    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
    console.log('✅ Keys successfully updated inside .env file');

    // 2. Refresh process.env and reinitialize config in memory
    process.env.OWNER_PRIVATE_KEY = ownerKey;
    process.env.VALIDATOR_PRIVATE_KEY = validatorKey;
    reinitializeConfig();
    console.log('✅ Viem Clients successfully reinitialized in memory');

    // 3. Hot-reload agent identity configuration
    try {
      agentId = await initializeAgent();
      console.log(`🤖 Hot-reloaded successfully. New Agent ID: ${agentId.toString()}`);
    } catch (e: any) {
      console.warn("⚠️ Hot-reloaded clients, but Identity check returned warning/failure:", e.message);
    }

    res.json({
      success: true,
      message: 'Keys successfully saved and activated in memory!',
      agentId: agentId.toString(),
      ownerAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
      validatorAddress: validatorAccount?.address || '0x0000000000000000000000000000000000000000'
    });

  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /subscriptions - adds or reactivates a subscription
app.post('/subscriptions', (req, res) => {
  try {
    const { name, amount, cost, costUSDC, renewalDate } = req.body;
    
    // Support amount, cost, or costUSDC
    const rawCost = amount !== undefined ? amount : (cost !== undefined ? cost : costUSDC);

    if (!name || rawCost === undefined || !renewalDate) {
      res.status(400).json({ error: 'Missing name, cost/amount, or renewalDate' });
      return;
    }

    const list = loadSubscriptions();
    const existingIndex = list.findIndex(s => s.name.toLowerCase() === name.toLowerCase());

    const numericCost = parseFloat(rawCost);
    if (isNaN(numericCost) || numericCost < 0) {
      res.status(400).json({ error: 'Cost must be a positive number' });
      return;
    }
    const usdcBigInt = BigInt(Math.round(numericCost * 1_000_000));
    const parsedDate = new Date(renewalDate);

    // Duplicate Handling:
    if (existingIndex !== -1) {
      const existingSub = list[existingIndex];
      
      if (!existingSub.active) {
        // Reactivate & Update
        existingSub.active = true;
        existingSub.amount = usdcBigInt;
        existingSub.renewalDate = parsedDate;
        saveSubscriptions(list);
        console.log(`🔄 Reactivated and updated inactive subscriptionpreset: ${name} ($${numericCost})`);
        res.json(existingSub);
        return;
      } else {
        // Return 200 with friendly message
        console.log(`ℹ️ Preset click ignored: ${name} is already active`);
        res.json({ 
          message: 'Already active — use Edit to update it',
          subscription: existingSub
        });
        return;
      }
    }

    // New Subscription
    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      name,
      clientAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
      renewalDate: parsedDate,
      amount: usdcBigInt,
      active: true
    };

    list.push(newSub);
    saveSubscriptions(list);

    console.log(`➕ Added new subscription: ${name} ($${numericCost})`);
    res.status(201).json(newSub);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /subscriptions/:name - updates name, cost, or renewal date
app.put('/subscriptions/:name', (req, res) => {
  try {
    const targetName = req.params.name;
    const { name, amount, cost, costUSDC, renewalDate } = req.body;

    const list = loadSubscriptions();
    const subIndex = list.findIndex(s => s.name.toLowerCase() === targetName.toLowerCase());

    if (subIndex === -1) {
      res.status(404).json({ error: `Subscription '${targetName}' not found` });
      return;
    }

    const sub = list[subIndex];

    if (name) {
      // If changing name, ensure new name is not a duplicate of another contract
      if (name.toLowerCase() !== targetName.toLowerCase() && list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        res.status(400).json({ error: `Subscription '${name}' already exists` });
        return;
      }
      sub.name = name;
    }

    const rawCost = amount !== undefined ? amount : (cost !== undefined ? cost : costUSDC);
    if (rawCost !== undefined) {
      const numericCost = parseFloat(rawCost);
      if (isNaN(numericCost) || numericCost < 0) {
        res.status(400).json({ error: 'Cost must be a positive number' });
        return;
      }
      sub.amount = BigInt(Math.round(numericCost * 1_000_000));
    }

    if (renewalDate) {
      sub.renewalDate = new Date(renewalDate);
    }

    saveSubscriptions(list);
    console.log(`📝 Updated subscription: ${targetName}`);
    res.json(sub);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /subscriptions/:name - marks as inactive (does NOT trigger a job)
app.delete('/subscriptions/:name', (req, res) => {
  try {
    const targetName = req.params.name;
    const list = loadSubscriptions();
    const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

    if (!sub) {
      res.status(404).json({ error: `Subscription '${targetName}' not found` });
      return;
    }

    sub.active = false;
    saveSubscriptions(list);
    console.log(`🗑️ Deactivated subscription: ${targetName}`);
    res.json({ message: `Subscription '${targetName}' deactivated.`, subscription: sub });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /subscriptions/:name/cancel - triggers the full ERC-8183 cancellation job
app.post('/subscriptions/:name/cancel', (req, res) => {
  try {
    const targetName = req.params.name;
    const list = loadSubscriptions();
    const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

    if (!sub) {
      res.status(404).json({ error: `Subscription '${targetName}' not found` });
      return;
    }

    if (!sub.active) {
      res.status(400).json({ error: `Subscription '${targetName}' is already inactive/cancelled.` });
      return;
    }

    console.log(`⚡ Manual Cancellation triggered for ${targetName}...`);
    
    // Set inactive immediately
    sub.active = false;
    saveSubscriptions(list);

    // Trigger full job lifecycle asynchronously
    executeCancellationJob(sub.name, agentId)
      .then(() => {
        console.log(`✅ Completed async cancellation job for ${targetName}`);
      })
      .catch((err) => {
        console.error(`❌ Async cancellation job failed for ${targetName}:`, err);
      });

    res.json({ 
      message: `ERC-8183 cancellation job successfully triggered for '${targetName}'.`,
      status: 'cancellation_triggered'
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /trigger - immediately runs the renewal check once
app.post('/trigger', async (req, res) => {
  try {
    console.log('⚡ Manual renewal check triggered via API.');
    await checkAndProcessRenewals(agentId);
    res.json({ message: 'Renewal check executed successfully.', status: 'triggered' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express API server running on http://localhost:${PORT}`);
});
