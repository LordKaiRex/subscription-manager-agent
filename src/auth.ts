import axios from 'axios';
import { randomUUID } from 'crypto';

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY!;
const BASE_URL = 'https://api.circle.com/v1/w3s';

// Step 1: Create or fetch user
export async function getOrCreateUser(userId: string) {
  try {
    await axios.post(`${BASE_URL}/users`, { userId }, {
      headers: { Authorization: `Bearer ${CIRCLE_API_KEY}` }
    });
  } catch (e: any) {
    if (!e.response?.data?.message?.includes('already exists') && !e.response?.data?.message?.includes('Duplicate')) throw e;
  }
}

// Step 2: Get user token + encryption key
export async function getUserToken(userId: string) {
  const res = await axios.post(`${BASE_URL}/users/token`, { userId }, {
    headers: { Authorization: `Bearer ${CIRCLE_API_KEY}` }
  });
  return res.data.data; // { userToken, encryptionKey }
}

// Step 3: Initialize wallet challenge
export async function initializeWallet(userToken: string) {
  const res = await axios.post(`${BASE_URL}/user/initialize`, {
    idempotencyKey: randomUUID()
  }, {
    headers: {
      Authorization: `Bearer ${CIRCLE_API_KEY}`,
      'X-User-Token': userToken
    }
  });
  return res.data.data.challengeId;
}

// Step 4: Get user wallets
export async function getUserWallets(userToken: string) {
  const res = await axios.get(`${BASE_URL}/wallets?blockchain=ARC-TESTNET`, {
    headers: {
      Authorization: `Bearer ${CIRCLE_API_KEY}`,
      'X-User-Token': userToken
    }
  });
  return res.data.data.wallets;
}
