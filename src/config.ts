import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Arc Testnet — the only and best network for this agent
// Chain ID: 5042002
// RPC: https://rpc.testnet.arc.network
// Explorer: https://testnet.arcscan.app
// Faucet: https://faucet.circle.com

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

let VALIDATOR_PRIVATE_KEY = process.env.VALIDATOR_PRIVATE_KEY as `0x${string}`;
let OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY as `0x${string}`;

export let validatorAccount = VALIDATOR_PRIVATE_KEY && VALIDATOR_PRIVATE_KEY.startsWith('0x') && VALIDATOR_PRIVATE_KEY.length === 66 
  ? privateKeyToAccount(VALIDATOR_PRIVATE_KEY) 
  : null;
export let ownerAccount = OWNER_PRIVATE_KEY && OWNER_PRIVATE_KEY.startsWith('0x') && OWNER_PRIVATE_KEY.length === 66 
  ? privateKeyToAccount(OWNER_PRIVATE_KEY) 
  : null;

export let validatorWalletClient = validatorAccount ? createWalletClient({
  account: validatorAccount,
  chain: arcTestnet,
  transport: http(),
}) : null;

export let ownerWalletClient = ownerAccount ? createWalletClient({
  account: ownerAccount,
  chain: arcTestnet,
  transport: http(),
}) : null;

export function reinitializeConfig() {
  VALIDATOR_PRIVATE_KEY = process.env.VALIDATOR_PRIVATE_KEY as `0x${string}`;
  OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY as `0x${string}`;

  validatorAccount = VALIDATOR_PRIVATE_KEY && VALIDATOR_PRIVATE_KEY.startsWith('0x') && VALIDATOR_PRIVATE_KEY.length === 66 
    ? privateKeyToAccount(VALIDATOR_PRIVATE_KEY) 
    : null;
  ownerAccount = OWNER_PRIVATE_KEY && OWNER_PRIVATE_KEY.startsWith('0x') && OWNER_PRIVATE_KEY.length === 66 
    ? privateKeyToAccount(OWNER_PRIVATE_KEY) 
    : null;

  validatorWalletClient = validatorAccount ? createWalletClient({
    account: validatorAccount,
    chain: arcTestnet,
    transport: http(),
  }) : null;

  ownerWalletClient = ownerAccount ? createWalletClient({
    account: ownerAccount,
    chain: arcTestnet,
    transport: http(),
  }) : null;
}


// IdentityRegistry ABI (ERC-8004)
export const IDENTITY_REGISTRY_ADDRESS = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
export const identityRegistryAbi = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "Transfer",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true,  name: "from",    type: "address"  },
      { indexed: true,  name: "to",      type: "address"  },
      { indexed: true,  name: "tokenId", type: "uint256"  },
    ],
  },
] as const;

// ReputationRegistry ABI (ERC-8004)
export const REPUTATION_REGISTRY_ADDRESS = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
export const reputationRegistryAbi = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId",      type: "uint256"  },
      { name: "score",        type: "int128"   },
      { name: "feedbackType", type: "uint8"    },
      { name: "tag",          type: "string"   },
      { name: "metadataURI",  type: "string"   },
      { name: "evidenceURI",  type: "string"   },
      { name: "comment",      type: "string"   },
      { name: "feedbackHash", type: "bytes32"  },
    ],
    outputs: [],
  },
  {
    name: "getFeedback",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "index",   type: "uint256" },
    ],
    outputs: [
      { name: "validator",    type: "address" },
      { name: "score",        type: "int128"  },
      { name: "feedbackType", type: "uint8"   },
      { name: "tag",          type: "string"  },
      { name: "timestamp",    type: "uint256" },
    ],
  },
  {
    name: "FeedbackGiven",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true,  name: "agentId",   type: "uint256" },
      { indexed: true,  name: "validator", type: "address" },
      { indexed: false, name: "score",     type: "int128"  },
      { indexed: false, name: "tag",       type: "string"  },
    ],
  },
] as const;

// ValidationRegistry ABI (ERC-8004)
export const VALIDATION_REGISTRY_ADDRESS = '0x8004Cb1BF31DAf7788923b405b754f57acEB4272';
export const validationRegistryAbi = [
  {
    name: "validationRequest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "validator",   type: "address" },
      { name: "agentId",     type: "uint256" },
      { name: "requestURI",  type: "string"  },
      { name: "requestHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "validationResponse",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestHash",  type: "bytes32" },
      { name: "response",     type: "uint8"   },
      { name: "responseURI",  type: "string"  },
      { name: "responseHash", type: "bytes32" },
      { name: "tag",          type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "getValidationStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestHash", type: "bytes32" }],
    outputs: [
      { name: "validatorAddress", type: "address" },
      { name: "agentId",          type: "uint256" },
      { name: "response",         type: "uint8"   },
      { name: "responseHash",     type: "bytes32" },
      { name: "tag",              type: "string"  },
      { name: "lastUpdate",       type: "uint256" },
    ],
  },
] as const;

// AgenticCommerce ABI (ERC-8183)
export const AGENTIC_COMMERCE_ADDRESS = '0x0747EEf0706327138c69792bF28Cd525089e4583';
export const agenticCommerceAbi = [
  {
    name: "createJob",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider",    type: "address" },
      { name: "evaluator",   type: "address" },
      { name: "expiredAt",   type: "uint256" },
      { name: "description", type: "string"  },
      { name: "hook",        type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    name: "setBudget",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId",     type: "uint256" },
      { name: "amount",    type: "uint256" },
      { name: "optParams", type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "fund",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId",     type: "uint256" },
      { name: "optParams", type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "submit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId",       type: "uint256"  },
      { name: "deliverable", type: "bytes32"  },
      { name: "optParams",   type: "bytes"    },
    ],
    outputs: [],
  },
  {
    name: "complete",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId",     type: "uint256" },
      { name: "reason",    type: "bytes32" },
      { name: "optParams", type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "reject",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId",     type: "uint256" },
      { name: "reason",    type: "bytes32" },
      { name: "optParams", type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "getJob",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "id",          type: "uint256" },
        { name: "client",      type: "address" },
        { name: "provider",    type: "address" },
        { name: "evaluator",   type: "address" },
        { name: "description", type: "string"  },
        { name: "budget",      type: "uint256" },
        { name: "expiredAt",   type: "uint256" },
        { name: "status",      type: "uint8"   },
        { name: "hook",        type: "address" },
      ],
    }],
  },
  {
    name: "JobCreated",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true,  name: "jobId",     type: "uint256" },
      { indexed: true,  name: "client",    type: "address" },
      { indexed: true,  name: "provider",  type: "address" },
      { indexed: false, name: "evaluator", type: "address" },
      { indexed: false, name: "expiredAt", type: "uint256" },
      { indexed: false, name: "hook",      type: "address" },
    ],
  },
  {
    name: "JobCompleted",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true,  name: "jobId",  type: "uint256" },
      { indexed: false, name: "reason", type: "bytes32" },
    ],
  },
  {
    name: "JobRejected",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true,  name: "jobId",  type: "uint256" },
      { indexed: false, name: "reason", type: "bytes32" },
    ],
  },
] as const;

// USDC ERC-20 ABI
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
export const usdcAbi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// USDC uses 6 decimals on the ERC-20 interface
export const USDC_DECIMALS = 6;
