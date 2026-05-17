import express from 'express';
import cors from 'cors';
import { loadSubscriptions, saveSubscriptions, cancelSubscription, Subscription } from './subscriptions.js';
import { executeCancellationJob } from './jobs.js';
import { checkAndProcessRenewals } from './checker.js';
import { initializeAgent } from './agent.js';
import { ownerAccount, validatorAccount } from './config.js';

const app = express();
const PORT = 3001;

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

// POST /subscriptions - adds a new subscription
app.post('/subscriptions', (req, res) => {
  try {
    const { name, amount, renewalDate } = req.body;
    if (!name || amount === undefined || !renewalDate) {
      res.status(400).json({ error: 'Missing name, amount, or renewalDate' });
      return;
    }

    const list = loadSubscriptions();
    
    // Check if subscription already exists
    if (list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      res.status(400).json({ error: `Subscription '${name}' already exists` });
      return;
    }

    // Convert amount from USD (e.g. 15.99) to USDC 6 decimals
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }
    const usdcBigInt = BigInt(Math.round(numericAmount * 1_000_000));

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      name,
      clientAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
      renewalDate: new Date(renewalDate),
      amount: usdcBigInt,
      active: true
    };

    list.push(newSub);
    saveSubscriptions(list);

    console.log(`➕ Added new subscription: ${name} ($${amount})`);
    res.status(201).json(newSub);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /subscriptions/:name - updates name, cost, or renewal date
app.put('/subscriptions/:name', (req, res) => {
  try {
    const targetName = req.params.name;
    const { name, amount, renewalDate } = req.body;

    const list = loadSubscriptions();
    const subIndex = list.findIndex(s => s.name.toLowerCase() === targetName.toLowerCase());

    if (subIndex === -1) {
      res.status(404).json({ error: `Subscription '${targetName}' not found` });
      return;
    }

    const sub = list[subIndex];

    if (name) {
      // If changing name, ensure new name is not a duplicate
      if (name.toLowerCase() !== targetName.toLowerCase() && list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        res.status(400).json({ error: `Subscription '${name}' already exists` });
        return;
      }
      sub.name = name;
    }

    if (amount !== undefined) {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }
      sub.amount = BigInt(Math.round(numericAmount * 1_000_000));
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
