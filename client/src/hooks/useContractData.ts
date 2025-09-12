"use client";

import { useState, useEffect } from "react";
import { useAccount, useContract, useNetwork, useProvider } from "@starknet-react/core";
import { getContractAddress } from "../lib/token";
import { CallData } from "starknet";
import { useToast } from "@/hooks/useToast";
import { MY_CONTRACT_ABI } from "@/lib/abi";

// Type definitions for challenge data
export interface Challenge {
  id: number;
  task: string;
  staker: string;
  acp: string;
  stake_amount: number;
  status: string;
  created_at: number;
  time_limit: number;
  acp_decision_at: number;
  dispute_raised_at: number;
  proof_cid: string;
}

export interface Case {
  id: number;
  challenge_id: number;
  status: string;
  task: string;
  stake_amount: number;
  jurors: number;
  total_juror_stake: number;
  created_at: number;
  enrollment_end: number;
  total_votes: number;
}

// Cache for challenge data to avoid refetching
const challengeCache = new Map<string, { 
  challenges: Challenge[], 
  timestamp: number 
}>();
const CACHE_DURATION = 30000; // 30 seconds cache

export function useContractData() {
  const { account, address, isConnected } = useAccount();
  const { provider } = useProvider();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const { chain} = useNetwork();
  const [isMainnet, setIsMainnet] = useState(false);
  const toast = useToast();

  const { contract } = useContract({
    abi: MY_CONTRACT_ABI as any,
    address: "0x071f6e98eaa176c0f939b948430cfec8036d6127cf3e0b6684fc5879b89bf578" as `0x${string}`,
  });


  // Fetch user's challenge from blockchain
  const fetchUserChallenge = async (useCache = true) => {
    if (!provider || !address) {
      setError("Provider not available or user not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching challenge for staker:", address);

      const result = await contract?.call("get_challenge_by_staker", [address as `0x${string}`]);
      
      console.log("📦 Raw result from contract call:", result);
      console.log("📦 Result type:", typeof result);
      console.log("📦 Result constructor:", result?.constructor?.name);
      console.log("📦 Result keys:", result ? Object.keys(result) : 'No keys');
      
      // Format the raw blockchain data to match our Challenge interface
      if (result && Array.isArray(result)) {
        const formattedChallenges: Challenge[] = result.map((challenge: any) => {
          // Format addresses to hex format
          const formatAddress = (address: bigint | string) => {
            if (typeof address === 'bigint') {
              return '0x' + address.toString(16).padStart(64, '0');
            }
            return address.toString();
          };
          
          // Format stake amount from wei to readable format (18 decimals)
          const formatStakeAmount = (amount: bigint | number) => {
            const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount);
            return Number(amountBigInt) / Math.pow(10, 18);
          };
          
          // Extract the active status (the one that's not undefined)
          let status = 'Unknown';
          if (challenge.status && challenge.status.variant) {
            const activeStatus = Object.keys(challenge.status.variant).find(key => 
              challenge.status.variant[key] !== undefined
            );
            status = activeStatus || 'Unknown';
          }
          
          return {
            id: Number(challenge.id),
            task: challenge.task,
            staker: formatAddress(challenge.staker),
            acp: formatAddress(challenge.acp),
            stake_amount: formatStakeAmount(challenge.stake_amount),
            status: status,
            created_at: Number(challenge.created_at),
            time_limit: Number(challenge.time_limit),
            acp_decision_at: Number(challenge.acp_decision_at),
            dispute_raised_at: Number(challenge.dispute_raised_at),
            proof_cid: challenge.proof_cid
          };
        });
        
        console.log("✅ Formatted challenges:", formattedChallenges);
        setChallenges(formattedChallenges);
      } else {
        console.log("⚠️ No challenges found or invalid result format");
        setChallenges([]);
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching challenge:", error);
     
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Fetch challenge data immediately when provider and address are available
  useEffect(() => {
    if (provider && address && isConnected) {
      fetchUserChallenge();
    }
  }, [provider, address, isConnected]);

  // Network detection - only run once when chain changes
  useEffect(() => {
    if (!chain) return;

    const isMainnetNetwork = chain.network === "mainnet";
    setIsMainnet(isMainnetNetwork);

  }, [chain?.network]); 

  return {
    challenges,
    loading,
    error,
    refetch: fetchUserChallenge,
    forceRefresh: () => fetchUserChallenge(false),
    isConnected,
    initialLoad,
    isFromCache: !loading && !initialLoad && challenges.length > 0,
  };
}