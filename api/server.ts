import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setDefaultResultOrder } from 'node:dns';
import { URL } from 'node:url';

// Force IPv4 DNS resolution first to avoid localhost/fetch issues with Circle APIs
try {
  setDefaultResultOrder('ipv4first');
} catch (e) {}

import { reinitializeConfig, ownerAccount, validatorAccount } from '../src/config.js';
import { loadSubscriptions, saveSubscriptions } from '../src/subscriptions.js';
import { initializeAgent } from '../src/agent.js';
import { loadJobs, executeCancellationJob } from '../src/jobs.js';
import { checkAndProcessRenewals } from '../src/checker.js';

// Helper to safely serialize BigInt values in JSON responses
function safeJSON(data: unknown) {
  return JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  
  // Vercel serverless rewrites store the original path in this header
  const forwardedPath = req.headers['x-vercel-forwarded-path'] as string || '';
  const resolvedPath = forwardedPath ? forwardedPath.split('?')[0] : pathname;
  
  const method = req.method || 'GET';
  const body = req.body || {};

  console.log('Request URL:', req.url, 'Resolved Path:', resolvedPath, 'Method:', method);

  try {
    // ── GET /auth/appid ──────────────────────────────────────────────────────
    if ((resolvedPath === '/auth/appid' || resolvedPath.includes('/auth/appid')) && method === 'GET') {
      console.log('CIRCLE_APP_ID value:', process.env.CIRCLE_APP_ID);
      res.status(200).json(safeJSON({
        appId: process.env.CIRCLE_APP_ID || '',
        googleClientId: process.env.CIRCLE_GOOGLE_CLIENT_ID || ''
      }));
      return;
    }

    // ── GET /debug ───────────────────────────────────────────────────────────
    if ((resolvedPath === '/debug' || resolvedPath.includes('/debug')) && method === 'GET') {
      res.status(200).json(safeJSON({
        hasApiKey: !!process.env.CIRCLE_API_KEY,
        hasAppId: !!process.env.CIRCLE_APP_ID,
        appIdLength: (process.env.CIRCLE_APP_ID || '').length,
        appIdPreview: (process.env.CIRCLE_APP_ID || '').substring(0, 8) + '...'
      }));
      return;
    }

    // ── GET /auth/config ─────────────────────────────────────────────────────
    if ((resolvedPath === '/auth/config' || resolvedPath.includes('/auth/config')) && method === 'GET') {
      res.status(200).json(safeJSON({
        smtpConfigured: process.env.SMTP_CONFIGURED === 'true',
        appId: process.env.CIRCLE_APP_ID || ''
      }));
      return;
    }

    // ── POST /auth/init ──────────────────────────────────────────────────────
    if ((resolvedPath === '/auth/init' || resolvedPath.includes('/auth/init')) && method === 'POST') {
      const { userId, deviceId } = body;
      console.log('Auth init called with:', { userId, deviceId });

      if (!userId || !deviceId) {
        res.status(400).json(safeJSON({ error: 'Missing userId or deviceId' }));
        return;
      }
      if (userId.length > 50) {
        res.status(400).json(safeJSON({ error: 'Email must be under 50 characters' }));
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
        res.status(400).json(safeJSON({ error: createData.message }));
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
          userId,
          deviceId,
          email: userId,
          idempotencyKey: crypto.randomUUID()
        })
      });

      const tokenData: any = await tokenRes.json();
      console.log('Token response:', tokenData);
      if (!tokenRes.ok) {
        res.status(400).json(safeJSON({ error: tokenData.message }));
        return;
      }

      res.status(200).json(safeJSON(tokenData.data));
      return;
    }

    // ── POST /auth/signin ────────────────────────────────────────────────────
    if ((resolvedPath === '/auth/signin' || resolvedPath.includes('/auth/signin')) && method === 'POST') {
      const { userId, deviceId } = body;
      console.log('Auth signin called with:', { userId, deviceId });

      if (!userId || !deviceId) {
        res.status(400).json(safeJSON({ error: 'Missing userId or deviceId' }));
        return;
      }

      const tokenRes = await fetch('https://api.circle.com/v1/w3s/users/email/token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          deviceId,
          email: userId,
          idempotencyKey: crypto.randomUUID()
        })
      });

      const tokenData: any = await tokenRes.json();
      console.log('Token response:', tokenData);
      if (!tokenRes.ok) {
        res.status(400).json(safeJSON({ error: tokenData.message }));
        return;
      }

      res.status(200).json(safeJSON(tokenData.data));
      return;
    }

    // ── POST /auth/initialize ────────────────────────────────────────────────
    if ((resolvedPath === '/auth/initialize' || resolvedPath.includes('/auth/initialize')) && method === 'POST') {
      const { userToken } = body;
      if (!userToken) {
        res.status(400).json(safeJSON({ error: 'Missing userToken' }));
        return;
      }

      const initRes = await fetch('https://api.circle.com/v1/w3s/user/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'X-User-Token': userToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          blockchains: ['ARC-TESTNET']
        })
      });

      const initData: any = await initRes.json();
      console.log('Initialize response:', initData);
      if (!initRes.ok) {
        res.status(400).json(safeJSON({ error: initData.message }));
        return;
      }

      // Return null (not undefined) so the frontend `if (challengeId)` check
      // correctly identifies when no PIN/security-question challenge is needed
      // (email-auth-only plans on Circle Testnet).
      res.status(200).json(safeJSON({ challengeId: initData.data?.challengeId ?? null }));
      return;
    }

    // ── POST /auth/wallets ───────────────────────────────────────────────────
    if ((resolvedPath === '/auth/wallets' || resolvedPath.includes('/auth/wallets')) && method === 'POST') {
      const { userToken } = body;
      if (!userToken) {
        res.status(400).json(safeJSON({ error: 'Missing userToken' }));
        return;
      }

      const walletsRes = await fetch('https://api.circle.com/v1/w3s/wallets?blockchain=ARC-TESTNET', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'X-User-Token': userToken
        }
      });

      const walletsData: any = await walletsRes.json();
      console.log('Wallets response:', walletsData);
      if (!walletsRes.ok) {
        res.status(400).json(safeJSON({ error: walletsData.message }));
        return;
      }

      const wallets = walletsData.data?.wallets || [];
      res.status(200).json(safeJSON({ walletAddress: wallets[0]?.address || null }));
      return;
    }

    // ── POST /auth/verify ────────────────────────────────────────────────────
    // Server-side OTP verification — replaces the Circle SDK iframe approach.
    // Calls Circle's token refresh endpoint with the OTP the user typed, gets
    // back a verified userToken, then immediately fetches the wallet address.
    if ((resolvedPath === '/auth/verify' || resolvedPath.includes('/auth/verify')) && method === 'POST') {
      const { otpToken, otp, deviceToken, deviceEncryptionKey } = body;
      if (!otpToken || !otp) {
        res.status(400).json(safeJSON({ error: 'Missing otpToken or otp' }));
        return;
      }

      const verifyRes = await fetch('https://api.circle.com/v1/w3s/user/token/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otpToken, otp, deviceToken, deviceEncryptionKey })
      });

      const verifyData: any = await verifyRes.json();
      console.log('OTP verify response:', JSON.stringify(verifyData));
      if (!verifyRes.ok) {
        res.status(400).json(safeJSON({ error: verifyData.message || 'Invalid OTP' }));
        return;
      }

      const { userToken, encryptionKey } = verifyData.data || {};
      if (!userToken) {
        res.status(400).json(safeJSON({ error: 'OTP verification did not return a userToken' }));
        return;
      }

      // Fetch wallet address immediately so the client gets everything in one call
      const walletsRes = await fetch('https://api.circle.com/v1/w3s/wallets?blockchain=ARC-TESTNET', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          'X-User-Token': userToken
        }
      });
      const walletsData: any = await walletsRes.json();
      const wallets = walletsData.data?.wallets || [];

      res.status(200).json(safeJSON({
        userToken,
        encryptionKey: encryptionKey || null,
        walletAddress: wallets[0]?.address || null
      }));
      return;
    }

    // ── GET /agent ───────────────────────────────────────────────────────────
    if ((resolvedPath === '/agent' || resolvedPath.includes('/agent')) && method === 'GET') {
      let agentId = 14535n;
      try {
        const id = await initializeAgent();
        if (id > 1n) agentId = id;
      } catch (e) {}

      res.status(200).json(safeJSON({
        agentId: (agentId > 1n ? agentId.toString() : undefined) || process.env.AGENT_ID || '14535',
        ownerAddress: process.env.OWNER_ADDRESS || ownerAccount?.address || '0x0000000000000000000000000000000000000000',
        validatorAddress: process.env.VALIDATOR_ADDRESS || validatorAccount?.address || '0x0000000000000000000000000000000000000000'
      }));
      return;
    }

    // ── GET /subscriptions ───────────────────────────────────────────────────
    if ((resolvedPath === '/subscriptions' || resolvedPath.includes('/subscriptions')) && method === 'GET' && !resolvedPath.endsWith('/cancel')) {
      const list = loadSubscriptions();
      res.status(200).json(safeJSON(list));
      return;
    }

    // ── POST /subscriptions ──────────────────────────────────────────────────
    if ((resolvedPath === '/subscriptions' || resolvedPath.includes('/subscriptions')) && method === 'POST' && !resolvedPath.endsWith('/cancel')) {
      const { name, amount, cost, costUSDC, renewalDate } = body;
      const rawCost = amount !== undefined ? amount : (cost !== undefined ? cost : costUSDC);

      if (!name || rawCost === undefined || !renewalDate) {
        res.status(400).json(safeJSON({ error: 'Missing name, cost/amount, or renewalDate' }));
        return;
      }

      const numericCost = parseFloat(rawCost);
      if (isNaN(numericCost) || numericCost < 0) {
        res.status(400).json(safeJSON({ error: 'Cost must be a positive number' }));
        return;
      }

      const list = loadSubscriptions();
      const existingIndex = list.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
      const usdcBigInt = BigInt(Math.round(numericCost * 1_000_000));

      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          amount: usdcBigInt,
          renewalDate: new Date(renewalDate),
          active: true
        };
      } else {
        list.push({
          id: `sub-${Date.now()}`,
          name,
          clientAddress: ownerAccount?.address || '0x1234567890123456789012345678901234567890',
          renewalDate: new Date(renewalDate),
          amount: usdcBigInt,
          active: true
        });
      }

      saveSubscriptions(list);
      res.status(200).json(safeJSON({ success: true, subscriptions: list }));
      return;
    }

    // ── PUT /subscriptions/:name ─────────────────────────────────────────────
    if (resolvedPath.startsWith('/subscriptions/') && method === 'PUT' && !resolvedPath.endsWith('/cancel')) {
      const targetName = decodeURIComponent(resolvedPath.split('/subscriptions/')[1].split('?')[0]);
      const list = loadSubscriptions();
      const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

      if (!sub) {
        res.status(404).json(safeJSON({ error: `Subscription '${targetName}' not found` }));
        return;
      }

      const { name, cost, renewalDate } = body;
      if (name) sub.name = name;
      if (renewalDate) sub.renewalDate = new Date(renewalDate);
      if (cost !== undefined) {
        const numericCost = parseFloat(cost);
        if (!isNaN(numericCost)) sub.amount = BigInt(Math.round(numericCost * 1_000_000));
      }
      saveSubscriptions(list);
      res.status(200).json(safeJSON({ success: true, subscription: sub }));
      return;
    }

    // ── DELETE /subscriptions/:name ──────────────────────────────────────────
    if (resolvedPath.startsWith('/subscriptions/') && method === 'DELETE' && !resolvedPath.endsWith('/cancel')) {
      const targetName = decodeURIComponent(resolvedPath.split('/subscriptions/')[1].split('?')[0]);
      const list = loadSubscriptions();
      const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

      if (!sub) {
        res.status(404).json(safeJSON({ error: `Subscription '${targetName}' not found` }));
        return;
      }

      sub.active = false;
      saveSubscriptions(list);
      res.status(200).json(safeJSON({
        message: `Subscription '${targetName}' deactivated.`,
        subscription: sub
      }));
      return;
    }

    // ── POST /subscriptions/:name/cancel ────────────────────────────────────
    if (resolvedPath.startsWith('/subscriptions/') && resolvedPath.endsWith('/cancel') && method === 'POST') {
      const parts = resolvedPath.split('/');
      const targetName = decodeURIComponent(parts[2]);
      const list = loadSubscriptions();
      const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

      if (!sub) {
        res.status(404).json(safeJSON({ error: `Subscription '${targetName}' not found` }));
        return;
      }
      if (!sub.active) {
        res.status(400).json(safeJSON({ error: `Subscription '${targetName}' is already inactive/cancelled.` }));
        return;
      }

      console.log(`⚡ Manual Cancellation triggered for ${targetName}...`);
      sub.active = false;
      saveSubscriptions(list);

      let agentId = 14535n;
      try {
        const id = await initializeAgent();
        if (id > 1n) agentId = id;
      } catch (e) {}

      executeCancellationJob(sub.name, agentId)
        .then(() => console.log(`✅ Completed async cancellation job for ${targetName}`))
        .catch(err => console.error(`❌ Async cancellation job failed for ${targetName}:`, err));

      res.status(200).json(safeJSON({
        message: `ERC-8183 cancellation job successfully triggered for '${targetName}'.`,
        status: 'cancellation_triggered'
      }));
      return;
    }

    // ── POST /trigger ────────────────────────────────────────────────────────
    if ((resolvedPath === '/trigger' || resolvedPath.includes('/trigger')) && method === 'POST') {
      console.log('⚡ Manual renewal check triggered via API.');
      let agentId = 14535n;
      try {
        const id = await initializeAgent();
        if (id > 1n) agentId = id;
      } catch (e) {}

      await checkAndProcessRenewals(agentId);
      res.status(200).json(safeJSON({ message: 'Renewal check executed successfully.', status: 'triggered' }));
      return;
    }

    // ── POST /setup-keys ─────────────────────────────────────────────────────
    if ((resolvedPath === '/setup-keys' || resolvedPath.includes('/setup-keys')) && method === 'POST') {
      const { ownerKey, validatorKey } = body;
      const hexRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!ownerKey || !hexRegex.test(ownerKey)) {
        res.status(400).json(safeJSON({ error: 'Owner Key must be a valid 0x-prefixed 64-character hex string' }));
        return;
      }
      if (!validatorKey || !hexRegex.test(validatorKey)) {
        res.status(400).json(safeJSON({ error: 'Validator Key must be a valid 0x-prefixed 64-character hex string' }));
        return;
      }

      process.env.OWNER_PRIVATE_KEY = ownerKey;
      process.env.VALIDATOR_PRIVATE_KEY = validatorKey;
      console.log('✅ Keys successfully updated in memory');

      reinitializeConfig();
      console.log('✅ Viem Clients successfully reinitialized in memory');

      let agentId = 14535n;
      try {
        agentId = await initializeAgent();
        console.log(`🤖 Hot-reloaded successfully. New Agent ID: ${agentId.toString()}`);
      } catch (e: any) {
        console.warn('⚠️ Hot-reloaded clients, but Identity check returned warning/failure:', e.message);
      }

      res.status(200).json(safeJSON({
        success: true,
        message: 'Keys successfully saved and activated in memory!',
        agentId: agentId.toString(),
        ownerAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
        validatorAddress: validatorAccount?.address || '0x0000000000000000000000000000000000000000'
      }));
      return;
    }

    // ── GET /jobs ────────────────────────────────────────────────────────────
    if ((resolvedPath === '/jobs' || resolvedPath.includes('/jobs')) && method === 'GET') {
      const data = loadJobs();
      res.status(200).json(safeJSON(data));
      return;
    }

    res.status(404).json(safeJSON({ error: 'Route not found: ' + resolvedPath }));
  } catch (err: any) {
    console.error('Handler error:', err);
    res.status(500).json(safeJSON({ error: err.message }));
  }
}
