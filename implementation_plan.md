# Subscription Manager Agent Implementation Plan

This document outlines the architecture and implementation strategy for the `subscription-manager-agent`. The agent will interact with EVM-compatible blockchains using `viem` to monitor and process on-chain subscription jobs.

## Background Context
The agent acts as an automated operator that processes recurring payments or subscription validations on-chain. It uses an `OWNER_PRIVATE_KEY` for administrative tasks and a `VALIDATOR_PRIVATE_KEY` for routine job execution.

## User Review Required
> [!IMPORTANT]
> Please review the structure and assumptions below. Since we do not have the specific Smart Contract ABI yet, the plan assumes a generic interface for fetching and processing subscriptions. **Will you provide the Smart Contract ABI or contract addresses next?**

## Open Questions
> [!WARNING]
> 1. Which blockchain network(s) will this agent operate on (e.g., Ethereum Mainnet, Base, Arbitrum, Sepolia)?
> 2. How frequently should the agent poll for new subscription jobs (e.g., every 15 seconds, once a minute)?
> 3. Should we install `dotenv` to load the `.env` variables, or will you use Node 20's native `--env-file` flag when running via `tsx`?

## Proposed Changes

### Configuration
#### [MODIFY] src/config.ts
- Load and validate environment variables (`OWNER_PRIVATE_KEY`, `VALIDATOR_PRIVATE_KEY`).
- Define the Target Chain configuration.
- Instantiate and export `viem` clients:
  - `publicClient` for reading chain state.
  - `walletClient` (using the Validator account) for executing transactions.

---

### Core Business Logic
#### [MODIFY] src/subscriptions.ts
- Store or import the Smart Contract ABI.
- Implement functions to interact with the Subscription Contract:
  - `getActiveSubscriptions()`
  - `getPendingJobs()`
- Export utility functions for parsing contract data.

#### [MODIFY] src/jobs.ts
- Implement the execution logic for processing a subscription.
- Functions to build and submit transactions (e.g., `processSubscription(subscriptionId)`).
- Handle transaction receipts, error handling (e.g., catching revert reasons), and gas estimation.

---

### Agent Lifecycle
#### [MODIFY] src/agent.ts
- Implement the main worker loop (e.g., `startPolling()`).
- Orchestrate the flow: fetch pending jobs from `subscriptions.ts` -> execute them via `jobs.ts`.
- Implement logging and robust error handling to ensure the agent doesn't crash on a single failed transaction.

#### [MODIFY] src/index.ts
- Act as the primary entry point.
- Bootstrap the configuration.
- Start the `Agent` and handle graceful shutdown signals (`SIGINT`, `SIGTERM`).

## Verification Plan
### Automated Tests
- We can write mock tests for the agent loop to ensure it correctly identifies jobs without sending real transactions.

### Manual Verification
- Deploy a test instance of the Subscription Contract to a testnet (e.g., Sepolia).
- Run the agent locally and verify it successfully processes a mock subscription job on the testnet.
