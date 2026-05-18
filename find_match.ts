import { keccak256, toBytes } from 'viem';
import { agenticCommerceAbi } from './src/config.js';

const target = '0x869e2577b006bf47ee981cf6fec2e25583548081c14b98deab587f77b5068038';

for (const item of agenticCommerceAbi) {
  if (item.type === 'event') {
    const signature = `${item.name}(${item.inputs.map(i => i.type).join(',')})`;
    const hash = keccak256(toBytes(signature));
    console.log(`${signature}: ${hash}`);
    if (hash === target) {
      console.log("MATCH FOUND!");
    }
  }
}
