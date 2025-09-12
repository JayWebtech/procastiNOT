/**
 * Time utility functions for handling Unix timestamps and Cairo contract compatibility
 */

/**
 * Convert minutes to Unix timestamp (seconds)
 * @param minutes - Duration in minutes
 * @returns Unix timestamp in seconds
 */
export function minutesToUnixTimestamp(minutes: number): number {
  return Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
}

/**
 * Get current Unix timestamp in seconds
 * @returns Current Unix timestamp
 */
export function getCurrentUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert Unix timestamp to Date object
 * @param unixTimestamp - Unix timestamp in seconds
 * @returns Date object
 */
export function unixTimestampToDate(unixTimestamp: number): Date {
  return new Date(unixTimestamp * 1000);
}

/**
 * Get remaining time until deadline in a human-readable format
 * @param deadlineUnix - Deadline as Unix timestamp in seconds
 * @returns Object with time components
 */
export function getRemainingTime(deadlineUnix: number): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = getCurrentUnixTimestamp();
  const total = Math.max(0, deadlineUnix - now);
  
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  
  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    isExpired: total === 0
  };
}

/**
 * Format remaining time as a string
 * @param deadlineUnix - Deadline as Unix timestamp in seconds
 * @returns Formatted time string
 */
export function formatRemainingTime(deadlineUnix: number): string {
  const time = getRemainingTime(deadlineUnix);
  
  if (time.isExpired) {
    return 'Expired';
  }
  
  if (time.days > 0) {
    return `${time.days}d ${time.hours}h ${time.minutes}m`;
  } else if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`;
  } else if (time.minutes > 0) {
    return `${time.minutes}m ${time.seconds}s`;
  } else {
    return `${time.seconds}s`;
  }
}

/**
 * Validate if a Unix timestamp is in the future
 * @param unixTimestamp - Unix timestamp in seconds
 * @returns True if timestamp is in the future
 */
export function isFutureTimestamp(unixTimestamp: number): boolean {
  return unixTimestamp > getCurrentUnixTimestamp();
}

/**
 * Get time limit for Cairo contract comparison
 * This is the timestamp when the challenge should expire
 * @param durationMinutes - Duration in minutes from now
 * @returns Unix timestamp in seconds for contract comparison
 */
export function getContractTimeLimit(durationMinutes: number): number {
  return minutesToUnixTimestamp(durationMinutes);
}

/**
 * Convert stake amount to contract format (wei-like)
 * @param amount - Amount in STRK tokens
 * @returns Amount in smallest unit (like wei)
 */
export function toContractAmount(amount: number): string {
  return Math.floor(amount * 1e18).toString();
}

/**
 * Convert contract amount back to STRK tokens
 * @param contractAmount - Amount in smallest unit
 * @returns Amount in STRK tokens
 */
export function fromContractAmount(contractAmount: string): number {
  return parseInt(contractAmount) / 1e18;
}

/**
 * Cairo contract time comparison helper
 * This generates the exact comparison logic for your Cairo contract
 * @param durationMinutes - Challenge duration in minutes
 * @returns Object with contract-ready data
 */
export function prepareChallengeForContract(data: {
  durationMinutes: number;
  stakeAmount: number;
  taskDescription: string;
  creatorWallet: string;
  acpWallet: string;
}) {
  const now = getCurrentUnixTimestamp();
  const timeLimit = getContractTimeLimit(data.durationMinutes);
  
  return {
    // For contract deployment
    timeLimit,
    stakeAmount: toContractAmount(data.stakeAmount),
    taskDescription: data.taskDescription,
    creatorWallet: data.creatorWallet,
    acpWallet: data.acpWallet,
    
    // For contract comparison (get_block_timestamp() > challenge.time_limit)
    comparisonValue: timeLimit,
    
    // Human readable info
    deadlineDate: unixTimestampToDate(timeLimit),
    durationMinutes: data.durationMinutes,
    
    // Validation
    isValid: timeLimit > now && data.durationMinutes >= 5
  };
}
