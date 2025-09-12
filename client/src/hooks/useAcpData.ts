"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useContract, useNetwork, useProvider } from "@starknet-react/core";
import { getContractAddress } from "@/lib/token";
import { CallData } from "starknet";
import { useToast } from "@/hooks/useToast";
import { Challenge } from "./useContractData";
import { MY_CONTRACT_ABI } from "@/lib/abi";


// Cache for ACP challenge data to avoid refetching
const acpChallengeCache = new Map<string, { 
  challenges: Challenge[], 
  timestamp: number 
}>();
const CACHE_DURATION = 30000; // 30 seconds cache

export function useAcpData() {
  const { account, address, isConnected } = useAccount();
  const { provider } = useProvider();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const { chain } = useNetwork();
  const [isMainnet, setIsMainnet] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const toast = useToast();
  const fetchInProgress = useRef(false);
  const CONTRACT_ADDRESS = getContractAddress(isMainnet);

  const { contract } = useContract({
    abi: MY_CONTRACT_ABI as any,
    address: CONTRACT_ADDRESS as `0x${string}`,
  });

  // Format the raw blockchain data (same as useContractData)
  const formatChallengeData = (result: any): Challenge[] => {
    if (!result || !Array.isArray(result)) {
      console.log("⚠️ No ACP challenges found or invalid result format");
      return [];
    }

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
    
    return formattedChallenges;
  };


  // Check cache first
  const getCachedAcpChallenges = (cacheKey: string) => {
    const cached = acpChallengeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }
    return null;
  };

  // Fetch user's ACP challenge from blockchain
  const fetchAcpChallenge = async (useCache = true) => {
    if (!provider || !address) {
      setError("Provider not available or user not connected");
      return;
    }

    const cacheKey = `acp_challenge_${address}`;
    
    // Check cache first
    if (useCache) {
      const cachedData = getCachedAcpChallenges(cacheKey);
      if (cachedData) {
        console.log(`📦 Using cached ACP challenges data for ${address}`);
        setChallenges(cachedData.challenges);
        setInitialLoad(false);
        setLoading(false);
        setHasFetched(true);
        fetchInProgress.current = false;
        return;
      }
    }

    // Prevent multiple simultaneous calls
    if (fetchInProgress.current) {
      console.log("🔄 ACP challenge fetch already in progress, skipping...");
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching ACP challenge for:", address);

      const result = await contract?.call("get_challenge_by_acp", [address as `0x${string}`]);
      
      console.log("📦 Raw ACP result from contract call:", result);
      console.log("📦 Result type:", typeof result);
      console.log("📦 Result constructor:", result?.constructor?.name);
      console.log("📦 Result keys:", result ? Object.keys(result) : 'No keys');
      
      // Format the raw blockchain data using the same method as useContractData
      const formattedChallenges = formatChallengeData(result);
      
      console.log("✅ Formatted ACP challenges:", formattedChallenges);
      setChallenges(formattedChallenges);
      
      // Cache the result
      if (formattedChallenges.length > 0) {
        acpChallengeCache.set(cacheKey, {
          challenges: formattedChallenges,
          timestamp: Date.now()
        });
        console.log(`✅ Cached ${formattedChallenges.length} ACP challenges for ${address}`);
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching ACP challenge:", error);
      
      // Check if it's a "challenge not found" error
      if (error.message?.includes("CHALLENGE_NOT_FOUND") || 
          error.message?.includes("challenge not found") ||
          error.message?.includes("Challenge not found") ||
          error.message?.includes("assertion failed")) {
        console.log("ℹ️ No ACP challenges found for this address (expected)");
        setChallenges([]);
        setError(null);
        
        // Show toast only on initial load to avoid spam
        if (initialLoad && !hasFetched) {
          toast.info({
            title: "No ACP Challenge",
            message: "You're not assigned as an accountability partner for any challenges yet."
          });
        }
      } else {
        console.log("❌ Unexpected ACP error:", error);
        setError(error.message || "Failed to fetch ACP challenge data");
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
      setHasFetched(true);
      fetchInProgress.current = false;
    }
  };

  // Network detection - only run once when chain changes
  useEffect(() => {
    if (!chain) return;

    const isMainnetNetwork = chain.network === "mainnet";
    setIsMainnet(isMainnetNetwork);

  }, [chain?.network]);

  // Note: ACP challenge data is only fetched when explicitly requested
  // This prevents unnecessary contract calls when user hasn't clicked ACP tab

  return {
    challenges,
    loading,
    error,
    refetch: fetchAcpChallenge,
    forceRefresh: () => fetchAcpChallenge(false),
    isConnected,
    initialLoad,
    hasFetched,
    isFromCache: !loading && !initialLoad && challenges.length > 0,
  };
}
