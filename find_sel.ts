import { keccak256, stringToHex } from 'viem';

function check(str) {
  if (keccak256(stringToHex(str)).startsWith('0x1d3e8e6b')) console.log("FOUND:", str);
}

check("getJob(uint256)");
check("jobs(uint256)");
check("job(uint256)");
check("getJobInfo(uint256)");
check("jobInfo(uint256)");
check("getAgentJob(uint256)");
check("agentJobs(uint256)");
check("agentJob(uint256)");
check("jobData(uint256)");
check("getJobData(uint256)");
check("getJobDetails(uint256)");
