/**
 * Cairo Contract Integration Helpers
 * 
 * This file contains utilities specifically for integrating with Cairo smart contracts
 * and handling time comparisons like: get_block_timestamp() > challenge.time_limit
 */

import { prepareChallengeForContract } from './timeUtils';

/**
 * Prepare challenge data for Cairo contract deployment
 * @param frontendData - Data from your frontend form
 * @returns Data formatted for Cairo contract
 */
export function prepareForCairoDeployment(frontendData: {
  durationMinutes: number;
  stakeAmount: number;
  taskDescription: string;
  creatorWallet: string;
  acpWallet: string;
}) {
  const contractData = prepareChallengeForContract(frontendData);
  
  return {
    // Core challenge data
    task: contractData.taskDescription,
    acp: contractData.acpWallet,
    staker: contractData.creatorWallet,
    stake_amount: contractData.stakeAmount,
    created_at: Math.floor(Date.now() / 1000), // Current Unix timestamp
    time_limit: contractData.timeLimit, // This is the key field for time comparison
    
    // Additional data
    duration_minutes: contractData.durationMinutes,
    deadline_date: contractData.deadlineDate,
    
    // For debugging/logging
    human_readable_deadline: contractData.deadlineDate.toLocaleString(),
    unix_timestamp: contractData.timeLimit,
    
    // Cairo comparison logic
    cairo_comparison: `get_block_timestamp() > ${contractData.timeLimit}`,
    is_valid: contractData.isValid
  };
}

/**
 * Generate the exact Cairo code for time comparison
 * @param timeLimit - Unix timestamp in seconds
 * @returns Cairo comparison code
 */
export function generateCairoTimeComparison(timeLimit: number): string {
  return `
// Cairo contract time comparison
let current_time = get_block_timestamp();
if current_time > ${timeLimit} {
    // Challenge has expired
    challenge.status = ChallengeStatus::Failed;
} else {
    // Challenge is still active
    challenge.status = ChallengeStatus::Active;
}
`;
}

/**
 * Validate time limit for Cairo contract
 * @param timeLimit - Unix timestamp in seconds
 * @returns Validation result
 */
export function validateTimeLimitForCairo(timeLimit: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const now = Math.floor(Date.now() / 1000);
  
  // Check if time limit is in the future
  if (timeLimit <= now) {
    errors.push('Time limit must be in the future');
  }
  
  // Check if time limit is too far in the future (more than 1 year)
  const oneYearFromNow = now + (365 * 24 * 60 * 60);
  if (timeLimit > oneYearFromNow) {
    warnings.push('Time limit is more than 1 year in the future');
  }
  
  // Check if time limit is too close (less than 5 minutes)
  const fiveMinutesFromNow = now + (5 * 60);
  if (timeLimit < fiveMinutesFromNow) {
    errors.push('Time limit must be at least 5 minutes in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Example usage in your frontend:
 * 
 * ```typescript
 * const challengeData = prepareForCairoDeployment({
 *   durationMinutes: 60, // 1 hour
 *   stakeAmount: 10, // 10 STRK
 *   taskDescription: "Complete React tutorial",
 *   creatorWallet: "0x123...",
 *   acpWallet: "0x456..."
 * });
 * 
 * // This time_limit can be used in your Cairo contract:
 * // get_block_timestamp() > challenge.time_limit
 * console.log(challengeData.time_limit); // Unix timestamp in seconds
 * 
 * // Deploy to contract
 * const tx = await contract.create_challenge(
 *   challengeData.task,
 *   challengeData.acp,
 *   challengeData.staker,
 *   challengeData.stake_amount,
 *   challengeData.time_limit
 * );
 * ```
 */

/**
 * Convert frontend form data to Cairo-ready format
 * @param formData - Data from your create-challenge form
 * @returns Ready-to-deploy Cairo challenge data
 */
export function formDataToCairo(formData: {
  email: string;
  taskDescription: string;
  accountabilityPartnerEmail: string;
  accountabilityPartnerWallet: string;
  timeLocked: string;
  amount: string;
  creatorWallet?: string;
}) {
  return prepareForCairoDeployment({
    durationMinutes: parseInt(formData.timeLocked),
    stakeAmount: parseFloat(formData.amount),
    taskDescription: formData.taskDescription,
    creatorWallet: formData.creatorWallet || "0x" + "0".repeat(64),
    acpWallet: formData.accountabilityPartnerWallet
  });
}

/**
 * Debug helper to show all time-related data
 * @param challengeData - Challenge data from prepareForCairoDeployment
 */
export function debugTimeData(challengeData: ReturnType<typeof prepareForCairoDeployment>) {
  console.log('🕐 Cairo Contract Time Data:');
  console.log('├─ Time Limit (Unix):', challengeData.time_limit);
  console.log('├─ Current Time (Unix):', Math.floor(Date.now() / 1000));
  console.log('├─ Deadline Date:', challengeData.human_readable_deadline);
  console.log('├─ Duration (minutes):', challengeData.duration_minutes);
  console.log('├─ Cairo Comparison:', challengeData.cairo_comparison);
  console.log('└─ Is Valid:', challengeData.is_valid);
  
  const validation = validateTimeLimitForCairo(challengeData.time_limit);
  if (!validation.isValid) {
    console.error('❌ Validation Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:', validation.warnings);
  }
}

/**
 * Convert task description to Cairo ByteArray format
 * For now, we'll use shortString encoding which has a 31 character limit
 * In production, you might want to use a more sophisticated encoding
 * @param taskDescription - The task description string
 * @returns Encoded task for Cairo contract
 */
export function encodeTaskForCairo(taskDescription: string): string {
  // For now, truncate to 31 characters and encode as shortString
  // In production, you might want to use IPFS or other storage solutions
  const truncated = taskDescription.slice(0, 31);
  return truncated;
}
