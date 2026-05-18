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
  const method = req.method || 'GET';
  const body = req.body || {};

  try {
    // ── GET /auth/appid ──────────────────────────────────────────────────────
    if (pathname === '/auth/appid' && method === 'GET') {
      console.log('CIRCLE_APP_ID requested:', process.env.CIRCLE_APP_ID);
      res.status(200).json({
        appId: process.env.CIRCLE_APP_ID || '',
        googleClientId: process.env.CIRCLE_GOOGLE_CLIENT_ID || ''
      });
      return;
    }

    // ── GET /auth/config ─────────────────────────────────────────────────────
    if (pathname === '/auth/config' && method === 'GET') {
      res.status(200).json({
        smtpConfigured: process.env.SMTP_CONFIGURED === 'true',
        appId: process.env.CIRCLE_APP_ID || ''
      });
      return;
    }

    // ── POST /auth/init ──────────────────────────────────────────────────────
    if (pathname === '/auth/init' && method === 'POST') {
      const { userId, deviceId } = body;
      console.log('Auth init called with:', { userId, deviceId });

      if (!userId || !deviceId) {
        res.status(400).json({ error: 'Missing userId or deviceId' });
        return;
      }
      if (userId.length > 50) {
        res.status(400).json({ error: 'Email must be under 50 characters' });
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
        res.status(400).json({ error: createData.message });
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
        res.status(400).json({ error: tokenData.message });
        return;
      }

      res.status(200).json(tokenData.data);
      return;
    }

    // ── POST /auth/signin ────────────────────────────────────────────────────
    if (pathname === '/auth/signin' && method === 'POST') {
      const { userId, deviceId } = body;
      console.log('Auth signin called with:', { userId, deviceId });

      if (!userId || !deviceId) {
        res.status(400).json({ error: 'Missing userId or deviceId' });
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
        res.status(400).json({ error: tokenData.message });
        return;
      }

      res.status(200).json(tokenData.data);
      return;
    }

    // ── POST /auth/initialize ────────────────────────────────────────────────
    if (pathname === '/auth/initialize' && method === 'POST') {
      const { userToken } = body;
      if (!userToken) {
        res.status(400).json({ error: 'Missing userToken' });
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
        res.status(400).json({ error: initData.message });
        return;
      }

      res.status(200).json({ challengeId: initData.data?.challengeId });
      return;
    }

    // ── POST /auth/wallets ───────────────────────────────────────────────────
    if (pathname === '/auth/wallets' && method === 'POST') {
      const { userToken } = body;
      if (!userToken) {
        res.status(400).json({ error: 'Missing userToken' });
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
        res.status(400).json({ error: walletsData.message });
        return;
      }

      const wallets = walletsData.data?.wallets || [];
      res.status(200).json({ walletAddress: wallets[0]?.address || null });
      return;
    }

    // ── GET /agent ───────────────────────────────────────────────────────────
    if (pathname === '/agent' && method === 'GET') {
      let agentId = 14535n;
      try {
        const id = await initializeAgent();
        if (id > 1n) agentId = id;
      } catch (e) {}

      res.status(200).json({
        agentId: (agentId > 1n ? agentId.toString() : undefined) || process.env.AGENT_ID || '14535',
        ownerAddress: process.env.OWNER_ADDRESS || ownerAccount?.address || '0x0000000000000000000000000000000000000000',
        validatorAddress: process.env.VALIDATOR_ADDRESS || validatorAccount?.address || '0x0000000000000000000000000000000000000000'
      });
      return;
    }

    // ── GET /subscriptions ───────────────────────────────────────────────────
    if (pathname === '/subscriptions' && method === 'GET') {
      const list = loadSubscriptions();
      res.status(200).json(list);
      return;
    }

    // ── POST /subscriptions ──────────────────────────────────────────────────
    if (pathname === '/subscriptions' && method === 'POST') {
      const { name, amount, cost, costUSDC, renewalDate } = body;
      const rawCost = amount !== undefined ? amount : (cost !== undefined ? cost : costUSDC);

      if (!name || rawCost === undefined || !renewalDate) {
        res.status(400).json({ error: 'Missing name, cost/amount, or renewalDate' });
        return;
      }

      const numericCost = parseFloat(rawCost);
      if (isNaN(numericCost) || numericCost < 0) {
        res.status(400).json({ error: 'Cost must be a positive number' });
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
      res.status(200).json({ success: true, subscriptions: list });
      return;
    }

    // ── DELETE /subscriptions/:name ──────────────────────────────────────────
    if (pathname.startsWith('/subscriptions/') && method === 'DELETE') {
      const parts = pathname.split('/');
      const targetName = decodeURIComponent(parts[2]);
      const list = loadSubscriptions();
      const sub = list.find(s => s.name.toLowerCase() === targetName.toLowerCase());

      if (!sub) {
        res.status(404).json({ error: `Subscription '${targetName}' not found` });
        return;
      }

      sub.active = false;
      saveSubscriptions(list);
      res.status(200).json({
        message: `Subscription '${targetName}' deactivated.`,
        subscription: sub
      });
      return;
    }

    // ── POST /subscriptions/:name/cancel ────────────────────────────────────
    if (pathname.startsWith('/subscriptions/') && pathname.endsWith('/cancel') && method === 'POST') {
      const parts = pathname.split('/');
      const targetName = decodeURIComponent(parts[2]);
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

      res.status(200).json({
        message: `ERC-8183 cancellation job successfully triggered for '${targetName}'.`,
        status: 'cancellation_triggered'
      });
      return;
    }

    // ── POST /trigger ────────────────────────────────────────────────────────
    if (pathname === '/trigger' && method === 'POST') {
      console.log('⚡ Manual renewal check triggered via API.');
      let agentId = 14535n;
      try {
        const id = await initializeAgent();
        if (id > 1n) agentId = id;
      } catch (e) {}

      await checkAndProcessRenewals(agentId);
      res.status(200).json({ message: 'Renewal check executed successfully.', status: 'triggered' });
      return;
    }

    // ── POST /setup-keys ─────────────────────────────────────────────────────
    if (pathname === '/setup-keys' && method === 'POST') {
      const { ownerKey, validatorKey } = body;
      const hexRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!ownerKey || !hexRegex.test(ownerKey)) {
        res.status(400).json({ error: 'Owner Key must be a valid 0x-prefixed 64-character hex string' });
        return;
      }
      if (!validatorKey || !hexRegex.test(validatorKey)) {
        res.status(400).json({ error: 'Validator Key must be a valid 0x-prefixed 64-character hex string' });
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

      res.status(200).json({
        success: true,
        message: 'Keys successfully saved and activated in memory!',
        agentId: agentId.toString(),
        ownerAddress: ownerAccount?.address || '0x0000000000000000000000000000000000000000',
        validatorAddress: validatorAccount?.address || '0x0000000000000000000000000000000000000000'
      });
      return;
    }

    // ── GET /jobs ────────────────────────────────────────────────────────────
    if (pathname === '/jobs' && method === 'GET') {
      const data = loadJobs();
      res.status(200).json(data);
      return;
    }

    res.status(404).json({ error: 'Route not found: ' + pathname });
  } catch (err: any) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
