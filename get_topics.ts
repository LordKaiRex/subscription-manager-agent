import { keccak256, stringToHex } from 'viem';

console.log("JobCreated:", keccak256(stringToHex("JobCreated(uint256,address,address,address,uint256,address)")));
console.log("JobCompleted:", keccak256(stringToHex("JobCompleted(uint256,bytes32)")));
console.log("FeedbackGiven:", keccak256(stringToHex("FeedbackGiven(uint256,address,int128,string)")));
