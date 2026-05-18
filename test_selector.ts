import { keccak256, stringToHex } from 'viem';
console.log("jobs selector:", keccak256(stringToHex("jobs(uint256)")).substring(0,10));
console.log("feedbacks selector:", keccak256(stringToHex("feedbacks(uint256,uint256)")).substring(0,10));
console.log("agentFeedbacks selector:", keccak256(stringToHex("agentFeedbacks(uint256,uint256)")).substring(0,10));
