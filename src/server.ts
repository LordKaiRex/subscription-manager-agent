import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

import { loadSubscriptions, saveSubscriptions, Subscription } from './subscriptions.js';
import { executeCancellationJob, loadJobs } from './jobs.js';
import { checkAndProcessRenewals } from './checker.js';
import { initializeAgent } from './agent.js';
import { ownerAccount, validatorAccount, reinitializeConfig } from './config.js';

const PORT = 3001;

let agentId = 1n;

// Initialize agent configuration
(async () => {
  try {
    agentId = await initializeAgent();
    console.log(`🤖 Server loaded. Agent ID: ${agentId.toString()}`);
  } catch (err) {
    console.error('❌ Failed to initialize agent in server:', err);
  }
})();

console.log('✅ Circle auth ready');

// ── Helpers ──────────────────────────────────────────────────────────────────

function sendJSON(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  );
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function sendFile(res: ServerResponse, filePath: string) {
  if (existsSync(filePath)) {
    const content = readFileSync(filePath);
    const ext = filePath.split('.').pop() || '';
    const types: Record<string, string> = {
      html: 'text/html',
      js: 'application/javascript',
      css: 'text/css',
      json: 'application/json',
      png: 'image/png',
      ico: 'image/x-icon',
      svg: 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

async function getBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => (raw += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch { resolve({}); }
    });
  });
}

/** Extract a named URL segment from a route pattern.
 *  matchRoute('/subscriptions/:name/cancel', '/subscriptions/netflix/cancel')
 *  → { name: 'netflix' }  or null if no match.
 */
function matchRoute(pattern: string, url: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const urlParts = url.split('/');
  if (patternParts.length !== urlParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

// ── Request handler ──────────────────────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const method = req.method || 'GET';
    // Strip query string for routing
    const url = (req.url || '/').split('?')[0];

    // ── CORS preflight ───────────────────────────────────────────────────────
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ── POST /auth/init ──────────────────────────────────────────────────────
  if (method === 'POST' && url === '/auth/init') {
    try {
      const body = await getBody(req);
      const { userId, deviceId } = body;
      const email = userId;
      console.log('Auth init called with:', { userId, deviceId });

      if (!userId || !deviceId) {
        sendJSON(res, 400, { error: 'Missing userId or deviceId' });
        return;
      }
      if (userId.length > 50) {
        sendJSON(res, 400, { error: 'Email must be under 50 characters' });
        return;
      }

      // Create user (ignore already exists)
      const createRes = await fetch('https://api.circle.com/v1/w3s/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      const createData: any = await createRes.json();
      console.log('Create user response:', createData);
      if (!createRes.ok && createData.code !== 155101) {
        sendJSON(res, 400, { error: createData.message });
        return;
      }

      // Get email token
      const tokenRes = await fetch('https://api.circle.com/v1/w3s/users/email/token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: email,
          deviceId: deviceId,
          email: email,
          idempotencyKey: randomUUID()
        })
      });
      const tokenData: any = await tokenRes.json();
      console.log('Email token response:', tokenData);
      if (!tokenRes.ok) {
        sendJSON(res, 400, { error: tokenData.message || 'Failed to send OTP' });
        return;
      }

      const { otpToken, deviceToken, deviceEncryptionKey } = tokenData.data;
      sendJSON(res, 200, { otpToken, deviceToken, deviceEncryptionKey });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── POST /auth/signin ────────────────────────────────────────────────────
  if (method === 'POST' && url === '/auth/signin') {
    try {
      const body = await getBody(req);
      const { userId, deviceId } = body;
      const email = userId;
      const tokenRes = await fetch('https://api.circle.com/v1/w3s/users/email/token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: email,
          deviceId: deviceId,
          email: email,
          idempotencyKey: randomUUID()
        })
      });
      const data: any = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error('Circle signin error:', data);
        sendJSON(res, 404, { error: 'No account found with this email. Please create an account first.' });
        return;
      }
      const { otpToken, deviceToken, deviceEncryptionKey } = data.data;
      sendJSON(res, 200, { otpToken, deviceToken, deviceEncryptionKey });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── POST /auth/initialize ────────────────────────────────────────────────
  if (method === 'POST' && url === '/auth/initialize') {
    try {
      const body = await getBody(req);
      const { userToken } = body;
      if (!userToken) {
        sendJSON(res, 400, { error: 'Missing userToken' });
        return;
      }
      const apiKey = process.env.CIRCLE_API_KEY;
      const initRes = await fetch('https://api.circle.com/v1/w3s/user/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-User-Token': userToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idempotencyKey: randomUUID(), blockchains: ['ARC-TESTNET'] })
      });
      const initData: any = await initRes.json();
      if (!initRes.ok) {
        sendJSON(res, initRes.status, { error: initData.message });
        return;
      }
      sendJSON(res, 200, { challengeId: initData.data?.challengeId });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── POST /auth/wallets ───────────────────────────────────────────────────
  if (method === 'POST' && url === '/auth/wallets') {
    try {
      const body = await getBody(req);
      const { userToken } = body;
      const apiKey = process.env.CIRCLE_API_KEY;
      const walletsRes = await fetch('https://api.circle.com/v1/w3s/wallets?blockchain=ARC-TESTNET', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-User-Token': userToken
        }
      });
      const walletsData: any = await walletsRes.json();
      if (!walletsRes.ok) {
        sendJSON(res, walletsRes.status, { error: walletsData.message });
        return;
      }
      const wallets = walletsData.data?.wallets || [];
      sendJSON(res, 200, { walletAddress: wallets[0]?.address || null });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── POST /auth/social ────────────────────────────────────────────────────
  if (method === 'POST' && url === '/auth/social') {
    try {
      const body = await getBody(req);
      const { provider } = body;
      const apiKey = process.env.CIRCLE_API_KEY;
      const appId = process.env.CIRCLE_APP_ID || '';
      const email = `social_${provider}_default_user@submanager.io`;

      const createRes = await fetch('https://api.circle.com/v1/w3s/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email })
      });
      const createData: any = await createRes.json();
      if (!createRes.ok && createData.code !== 155101) {
        sendJSON(res, 400, { error: createData.message });
        return;
      }

      const tokenRes = await fetch('https://api.circle.com/v1/w3s/users/token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email })
      });
      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok) {
        sendJSON(res, tokenRes.status, { error: tokenData.message });
        return;
      }

      sendJSON(res, 200, {
        userToken: tokenData.data.userToken,
        encryptionKey: tokenData.data.encryptionKey,
        appId
      });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── GET /auth/config ─────────────────────────────────────────────────────
  if (method === 'GET' && url === '/auth/config') {
    sendJSON(res, 200, {
      appId: process.env.CIRCLE_APP_ID || '',
      googleClientId: process.env.CIRCLE_GOOGLE_CLIENT_ID || ''
    });
    return;
  }

  // ── GET /auth/appid ──────────────────────────────────────────────────────
  if (method === 'GET' && url === '/auth/appid') {
    console.log('CIRCLE_APP_ID:', process.env.CIRCLE_APP_ID);
    sendJSON(res, 200, {
      appId: process.env.CIRCLE_APP_ID || '',
      googleClientId: process.env.CIRCLE_GOOGLE_CLIENT_ID || ''
    });
    return;
  }

  // ── GET /agent ───────────────────────────────────────────────────────────
  if (method === 'GET' && url === '/agent') {
    sendJSON(res, 200, {
      agentId: (agentId > 1n ? agentId.toString() : undefined) || process.env.AGENT_ID || '14535',
      ownerAddress: process.env.OWNER_ADDRESS || ownerAccount?.address || '0x0000000000000000000000000000000000000000',
      validatorAddress: process.env.VALIDATOR_ADDRESS || validatorAccount?.address || '0x0000000000000000000000000000000000000000'
    });
    return;
  }

  // ── GET /subscriptions ───────────────────────────────────────────────────
  if (method === 'GET' && url === '/subscriptions') {
    try {
      const list = loadSubscriptions();
      sendJSON(res, 200, list);
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── GET /jobs ────────────────────────────────────────────────────────────
  if (method === 'GET' && url === '/jobs') {
    try {
      const data = loadJobs();
      sendJSON(res, 200, data);
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── POST /setup-keys ─────────────────────────────────────────────────────
  if (method === 'POST' && url === '/setup-keys') {
    try {
      const body = await getBody(req);
      const { ownerKey, validatorKey } = body;

      const hexRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!ownerKey || !hexRegex.test(ownerKey)) {
        sendJSON(res, 400, { error: 'Owner Key must be a valid 0x-prefixed 64-character hex string' });
        return;
      }
      if (!validatorKey || !hexRegex.test(validatorKey)) {
        sendJSON(res, 400, { error: 'Validator Key must be a valid 0x-prefixed 64-character hex string' });
        return;
      }

      const envPath = resolve(process.cwd(), '.env');
      let envContent = '';
      if (existsSync(envPath)) {
        envContent = readFileSync(envPath, 'utf8');
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

      writeFileSync(envPath, lines.join('\n'), 'utf8');
      console.log('✅ Keys successfully updated inside .env file');

      process.env.OWNER_PRIVATE_KEY = ownerKey;
      process.env.VALIDATOR_PRIVATE_KEY = validatorKey;
      reinitializeConfig();
      console.log('✅ Viem Clients successfully reinitialized in memory');

      try {
        agentId = await initializeAgent();
        console.log(`🤖 Hot-reloaded successfully. New Agent ID: ${agentId.toString()}`);
      } catch (e: any) {
        console.warn('⚠️ Hot-reloaded clients, but Identity check returned warning/failure:', e.message);
      }

      sendJSON(res, 200, {
        success: true,
        message: 'Keys successfully saved and activated in memory!',
        agentId: agentId.toString(),
        ownerAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
        validatorAddress: validatorAccount?.address || '0x0000000000000000000000000000000000000000'
      });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── POST /subscriptions ──────────────────────────────────────────────────
  if (method === 'POST' && url === '/subscriptions') {
    try {
      const body = await getBody(req);
      const { name, amount, cost, costUSDC, renewalDate } = body;

      const rawCost = amount !== undefined ? amount : (cost !== undefined ? cost : costUSDC);

      if (!name || rawCost === undefined || !renewalDate) {
        sendJSON(res, 400, { error: 'Missing name, cost/amount, or renewalDate' });
        return;
      }

      const numericCost = parseFloat(rawCost);
      if (isNaN(numericCost) || numericCost < 0) {
        sendJSON(res, 400, { error: 'Cost must be a positive number' });
        return;
      }

      const list = loadSubscriptions();
      const existingIndex = list.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
      const usdcBigInt = BigInt(Math.round(numericCost * 1_000_000));
      const parsedDate = new Date(renewalDate);

      if (existingIndex !== -1) {
        const existingSub = list[existingIndex];
        if (!existingSub.active) {
          existingSub.active = true;
          existingSub.amount = usdcBigInt;
          existingSub.renewalDate = parsedDate;
          saveSubscriptions(list);
          console.log(`🔄 Reactivated and updated inactive subscription: ${name} ($${numericCost})`);
          sendJSON(res, 200, existingSub);
          return;
        } else {
          console.log(`ℹ️ Preset click ignored: ${name} is already active`);
          sendJSON(res, 200, {
            message: 'Already active — use Edit to update it',
            subscription: existingSub
          });
          return;
        }
      }

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
      sendJSON(res, 201, newSub);
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── PUT /subscriptions/:name ─────────────────────────────────────────────
  {
    const params = matchRoute('/subscriptions/:name', url);
    if (method === 'PUT' && params) {
      try {
        const targetName = params.name;
        const body = await getBody(req);
        const { name, amount, cost, costUSDC, renewalDate } = body;

        const list = loadSubscriptions();
        const subIndex = list.findIndex(s => s.name.toLowerCase() === targetName.toLowerCase());

        if (subIndex === -1) {
          sendJSON(res, 404, { error: `Subscription '${targetName}' not found` });
          return;
        }

        const sub = list[subIndex];

        if (name) {
          if (
            name.toLowerCase() !== targetName.toLowerCase() &&
            list.some(s => s.name.toLowerCase() === name.toLowerCase())
          ) {
            sendJSON(res, 400, { error: `Subscription '${name}' already exists` });
            return;
          }
          sub.name = name;
        }

        const rawCost = amount !== undefined ? amount : (cost !== undefined ? cost : costUSDC);
        if (rawCost !== undefined) {
          const numericCost = parseFloat(rawCost);
          if (isNaN(numericCost) || numericCost < 0) {
            sendJSON(res, 400, { error: 'Cost must be a positive number' });
            return;
          }
          sub.amount = BigInt(Math.round(numericCost * 1_000_000));
        }

        if (renewalDate) {
          sub.renewalDate = new Date(renewalDate);
        }

        saveSubscriptions(list);
        console.log(`📝 Updated subscription: ${targetName}`);
        sendJSON(res, 200, sub);
      } catch (e: any) {
        sendJSON(res, 500, { error: e.message });
      }
      return;
    }
  }

  // ── DELETE /subscriptions/:name ──────────────────────────────────────────
  {
    const params = matchRoute('/subscriptions/:name', url);
    if (method === 'DELETE' && params) {
      try {
        const targetName = params.name;
        const list = loadSubscriptions();
        const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

        if (!sub) {
          sendJSON(res, 404, { error: `Subscription '${targetName}' not found` });
          return;
        }

        sub.active = false;
        saveSubscriptions(list);
        console.log(`🗑️ Deactivated subscription: ${targetName}`);
        sendJSON(res, 200, {
          message: `Subscription '${targetName}' deactivated.`,
          subscription: sub
        });
      } catch (e: any) {
        sendJSON(res, 500, { error: e.message });
      }
      return;
    }
  }

  // ── POST /subscriptions/:name/cancel ────────────────────────────────────
  {
    const params = matchRoute('/subscriptions/:name/cancel', url);
    if (method === 'POST' && params) {
      try {
        const targetName = params.name;
        const list = loadSubscriptions();
        const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

        if (!sub) {
          sendJSON(res, 404, { error: `Subscription '${targetName}' not found` });
          return;
        }
        if (!sub.active) {
          sendJSON(res, 400, { error: `Subscription '${targetName}' is already inactive/cancelled.` });
          return;
        }

        console.log(`⚡ Manual Cancellation triggered for ${targetName}...`);
        sub.active = false;
        saveSubscriptions(list);

        executeCancellationJob(sub.name, agentId)
          .then(() => console.log(`✅ Completed async cancellation job for ${targetName}`))
          .catch(err => console.error(`❌ Async cancellation job failed for ${targetName}:`, err));

        sendJSON(res, 200, {
          message: `ERC-8183 cancellation job successfully triggered for '${targetName}'.`,
          status: 'cancellation_triggered'
        });
      } catch (e: any) {
        sendJSON(res, 500, { error: e.message });
      }
      return;
    }
  }

  // ── POST /trigger ────────────────────────────────────────────────────────
  if (method === 'POST' && url === '/trigger') {
    try {
      console.log('⚡ Manual renewal check triggered via API.');
      await checkAndProcessRenewals(agentId);
      sendJSON(res, 200, { message: 'Renewal check executed successfully.', status: 'triggered' });
    } catch (e: any) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // ── GET / (dashboard) ────────────────────────────────────────────────────
  if (method === 'GET' && url === '/') {
    sendFile(res, join(process.cwd(), 'index.html'));
    return;
  }

  // ── Static file fallback ─────────────────────────────────────────────────
  if (method === 'GET') {
    sendFile(res, join(process.cwd(), url));
    return;
  }

  // ── 404 ──────────────────────────────────────────────────────────────────
    sendJSON(res, 404, { error: 'Route not found' });
  } catch (err: any) {
    console.error('Server error:', err.message, err.stack);
    sendJSON(res, 500, { error: 'Server error: ' + err.message });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => console.error('Uncaught:', err.message));
process.on('unhandledRejection', (reason) => console.error('Rejection:', reason));
