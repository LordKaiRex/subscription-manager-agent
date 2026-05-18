import { parseAbiItem } from 'viem';
console.log(require('viem').getAbiItem({
  abi: [parseAbiItem('event FeedbackGiven(uint256 indexed agentId, address indexed validator, int128 score, string tag)')],
  name: 'FeedbackGiven'
}));
