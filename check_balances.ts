import { formatEther, formatUnits } from 'viem';
import { publicClient, ownerAccount, validatorAccount, USDC_ADDRESS, usdcAbi, USDC_DECIMALS } from './src/config.js';

async function checkBalances() {
  console.log("Checking balances on Arc Testnet...\n");

  const accounts = [
    { name: 'Owner', address: ownerAccount?.address },
    { name: 'Validator', address: validatorAccount?.address }
  ];

  for (const acc of accounts) {
    if (!acc.address) {
      console.log(`${acc.name} address not found! Check private keys.`);
      continue;
    }

    try {
      const nativeBalance = await publicClient.getBalance({ address: acc.address });
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: usdcAbi,
        functionName: 'balanceOf',
        args: [acc.address]
      });

      console.log(`--- ${acc.name} (${acc.address}) ---`);
      console.log(`Native ARC: ${formatEther(nativeBalance)}`);
      console.log(`USDC:       ${formatUnits(usdcBalance as bigint, USDC_DECIMALS)}\n`);
    } catch (e: any) {
      console.error(`Error fetching balances for ${acc.name}: ${e.message}`);
    }
  }
}

checkBalances();
