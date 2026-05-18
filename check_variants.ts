import { keccak256, toBytes } from 'viem';

const target = '0x869e2577b006bf47ee981cf6fec2e25583548081c14b98deab587f77b5068038';

const variants = [
  "JobCompleted(uint256)",
  "JobCompleted(uint256,address)",
  "JobFinished(uint256,bytes32)",
  "JobFinished(uint256)",
  "JobDone(uint256,bytes32)",
  "JobDone(uint256)",
  "JobFinalized(uint256,bytes32)",
  "JobFinalized(uint256)",
  "JobClosed(uint256,bytes32)",
  "JobClosed(uint256)"
];

for (const v of variants) {
  const hash = keccak256(toBytes(v));
  console.log(`${v}: ${hash}`);
  if (hash === target) {
    console.log("MATCH FOUND!");
  }
}
