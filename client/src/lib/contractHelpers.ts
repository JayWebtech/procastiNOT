// import { Contract, RpcProvider, Account } from 'starknet';
// import { getContractAddress } from './token';

// // Import your contract ABI
// //import contractAbi from './abi';

// // Contract helper functions
// export class ProcastiNotContract {
//   private contract: Contract;
//   private provider: RpcProvider;

//   constructor(provider: RpcProvider, account?: Account) {
//     this.provider = provider;
//     const contractAddress = getContractAddress(false); // Use testnet for now
    
//     this.contract = new Contract(
//       contractAbi as any,
//       contractAddress!,
//       provider
//     );

//     if (account) {
//       this.contract.connect(account);
//     }
//   }

//   // Get challenge by ID
//   async getChallenge(challengeId: number) {
//     try {
//       const result = await this.contract.get_challenge(challengeId);
//       return this.parseChallenge(result);
//     } catch (error) {
//       console.error('Error fetching challenge:', error);
//       throw error;
//     }
//   }

//   // Get challenge by staker address
//   async getChallengeByStaker(stakerAddress: string) {
//     try {
//       const result = await this.contract.get_challenge_by_staker(stakerAddress);
//       return this.parseChallenge(result);
//     } catch (error) {
//       console.error('Error fetching challenge by staker:', error);
//       throw error;
//     }
//   }

//   // Get case by ID
//   async getCase(caseId: number) {
//     try {
//       const result = await this.contract.get_case(caseId);
//       return this.parseCase(result);
//     } catch (error) {
//       console.error('Error fetching case:', error);
//       throw error;
//     }
//   }

//   // Get juror info
//   async getJurorInfo(jurorAddress: string) {
//     try {
//       const result = await this.contract.get_juror_info(jurorAddress);
//       return this.parseJuror(result);
//     } catch (error) {
//       console.error('Error fetching juror info:', error);
//       throw error;
//     }
//   }

//   // Parse challenge data from contract
//   private parseChallenge(data: any) {
//     return {
//       id: Number(data.id),
//       task: this.parseByteArray(data.task),
//       staker: data.staker,
//       acp: data.acp,
//       stake_amount: this.parseU256(data.stake_amount),
//       status: this.parseChallengeStatus(data.status),
//       created_at: Number(data.created_at),
//       time_limit: Number(data.time_limit),
//       acp_decision_at: Number(data.acp_decision_at),
//       dispute_raised_at: Number(data.dispute_raised_at),
//       proof_cid: data.proof_cid
//     };
//   }

//   // Parse case data from contract
//   private parseCase(data: any) {
//     return {
//       id: Number(data.id),
//       challenge_id: Number(data.challenge_id),
//       status: this.parseCaseStatus(data.status),
//       task: this.parseByteArray(data.task),
//       stake_amount: this.parseU256(data.stake_amount),
//       jurors: Number(data.jurors),
//       total_juror_stake: this.parseU256(data.total_juror_stake),
//       created_at: Number(data.created_at),
//       enrollment_end: Number(data.enrollment_end),
//       total_votes: Number(data.total_votes)
//     };
//   }

//   // Parse juror data from contract
//   private parseJuror(data: any) {
//     return {
//       address: data.address,
//       reputation: Number(data.reputation),
//       stake_committed: this.parseU256(data.stake_committed),
//       vote_committed: Number(data.vote_committed)
//     };
//   }

//   // Parse ByteArray to string
//   private parseByteArray(byteArray: any): string {
//     if (!byteArray || !byteArray.data) return '';
    
//     try {
//       // Convert ByteArray to string
//       let result = '';
//       for (const chunk of byteArray.data) {
//         if (chunk && chunk !== '0x0') {
//           // Convert felt252 to string
//           const hex = chunk.toString(16);
//           if (hex.length > 0) {
//             result += Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
//           }
//         }
//       }
//       return result.trim();
//     } catch (error) {
//       console.error('Error parsing ByteArray:', error);
//       return '';
//     }
//   }

//   // Parse u256 to number
//   private parseU256(u256: any): number {
//     if (!u256) return 0;
    
//     try {
//       // Convert u256 (low, high) to number
//       const low = BigInt(u256.low || 0);
//       const high = BigInt(u256.high || 0);
//       const result = (high << BigInt(128)) | low;
      
//       // Convert to STRK (assuming 18 decimals)
//       return Number(result) / 1e18;
//     } catch (error) {
//       console.error('Error parsing u256:', error);
//       return 0;
//     }
//   }

//   // Parse challenge status
//   private parseChallengeStatus(status: any): string {
//     if (!status) return 'Unknown';
    
//     // Handle enum variants
//     if (typeof status === 'object') {
//       if (status.Created) return 'Created';
//       if (status.Locked) return 'Locked';
//       if (status.ACPApproved) return 'ACPApproved';
//       if (status.ACPRejected) return 'ACPRejected';
//       if (status.Disputed) return 'Disputed';
//       if (status.Resolved) return 'Resolved';
//     }
    
//     return 'Unknown';
//   }

//   // Parse case status
//   private parseCaseStatus(status: any): string {
//     if (!status) return 'Unknown';
    
//     // Handle enum variants
//     if (typeof status === 'object') {
//       if (status.JurorEnrollment) return 'JurorEnrollment';
//       if (status.VotePhase) return 'VotePhase';
//       if (status.Resolved) return 'Resolved';
//     }
    
//     return 'Unknown';
//   }
// }

// // Helper function to create contract instance
// export const createContractInstance = (provider: RpcProvider, account?: Account) => {
//   return new ProcastiNotContract(provider, account);
// };

// // Types for better TypeScript support
// export interface Challenge {
//   id: number;
//   task: string;
//   staker: string;
//   acp: string;
//   stake_amount: number;
//   status: string;
//   created_at: number;
//   time_limit: number;
//   acp_decision_at: number;
//   dispute_raised_at: number;
//   proof_cid: string;
// }

// export interface Case {
//   id: number;
//   challenge_id: number;
//   status: string;
//   task: string;
//   stake_amount: number;
//   jurors: number;
//   total_juror_stake: number;
//   created_at: number;
//   enrollment_end: number;
//   total_votes: number;
// }

// export interface Juror {
//   address: string;
//   reputation: number;
//   stake_committed: number;
//   vote_committed: number;
// }
