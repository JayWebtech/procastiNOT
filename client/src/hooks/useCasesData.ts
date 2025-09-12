"use client";

import { useState, useEffect } from "react";
import { useAccount, useContract, useNetwork, useProvider } from "@starknet-react/core";
import { useToast } from "@/hooks/useToast";
import { MY_CONTRACT_ABI } from "@/lib/abi";
import { getContractAddress } from "@/lib/token";

// Type definitions for case data
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
  proof_cid: string;
}

// Cache for cases data to avoid refetching
const casesCache = new Map<string, { 
  cases: Case[], 
  timestamp: number 
}>();
const CACHE_DURATION = 30000; // 30 seconds cache

export function useCasesData() {
  const { account, address, isConnected } = useAccount();
  const { provider } = useProvider();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const { chain } = useNetwork();
  const [isMainnet, setIsMainnet] = useState(false);
  const toast = useToast();
  const CONTRACT_ADDRESS = getContractAddress(isMainnet);

  const { contract } = useContract({
    abi: MY_CONTRACT_ABI as any,
    address: CONTRACT_ADDRESS as `0x${string}`,
  });

  // Format the raw blockchain data
  const formatCaseData = (result: any): Case[] => {
    if (!result || !Array.isArray(result)) {
      console.log("⚠️ No cases found or invalid result format");
      return [];
    }

    const formattedCases: Case[] = result.map((case_: any) => {
      // Format stake amount from wei to readable format (18 decimals)
      const formatStakeAmount = (amount: bigint | number) => {
        const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount);
        return Number(amountBigInt) / Math.pow(10, 18);
      };
      
      // Extract the active status (the one that's not undefined)
      let status = 'Unknown';
      if (case_.status && case_.status.variant) {
        const activeStatus = Object.keys(case_.status.variant).find(key => 
          case_.status.variant[key] !== undefined
        );
        status = activeStatus || 'Unknown';
      }
      
      return {
        id: Number(case_.id),
        challenge_id: Number(case_.challenge_id),
        status: status,
        task: case_.task,
        stake_amount: formatStakeAmount(case_.stake_amount),
        jurors: Number(case_.jurors),
        total_juror_stake: formatStakeAmount(case_.total_juror_stake),
        created_at: Number(case_.created_at),
        enrollment_end: Number(case_.enrollment_end),
        total_votes: Number(case_.total_votes),
        proof_cid: case_.proof_cid
      };
    });
    
    return formattedCases;
  };

  // Check cache first
  const getCachedCases = (cacheKey: string) => {
    const cached = casesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }
    return null;
  };

  // Fetch all cases from blockchain
  const fetchCases = async (useCache = true) => {
    if (!provider) {
      setError("Provider not available");
      return;
    }

    const cacheKey = "all_cases";
    
    // Check cache first
    if (useCache) {
      const cachedData = getCachedCases(cacheKey);
      if (cachedData) {
        console.log("📦 Using cached cases data");
        setCases(cachedData.cases);
        setInitialLoad(false);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching all cases from contract");

      const result = await contract?.call("get_all_cases", []);
      
      console.log("📦 Raw cases result from contract call:", result);
      console.log("📦 Result type:", typeof result);
      console.log("📦 Result constructor:", result?.constructor?.name);
      console.log("📦 Result keys:", result ? Object.keys(result) : 'No keys');
      
      // Format the raw blockchain data
      const formattedCases = formatCaseData(result);
      
      console.log("✅ Formatted cases:", formattedCases);
      setCases(formattedCases);
      
      // Cache the result
      if (formattedCases.length > 0) {
        casesCache.set(cacheKey, {
          cases: formattedCases,
          timestamp: Date.now()
        });
        console.log(`✅ Cached ${formattedCases.length} cases`);
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching cases:", error);
      
      // Check if it's a "no cases found" error
      if (error.message?.includes("assertion failed") || 
          error.message?.includes("no cases found")) {
        console.log("ℹ️ No cases found (expected)");
        setCases([]);
        setError(null);
      } else {
        console.log("❌ Unexpected cases error:", error);
        setError(error.message || "Failed to fetch cases data");
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Network detection - only run once when chain changes
  useEffect(() => {
    if (!chain) return;

    const isMainnetNetwork = chain.network === "mainnet";
    setIsMainnet(isMainnetNetwork);

  }, [chain?.network]);

  return {
    cases,
    loading,
    error,
    refetch: fetchCases,
    forceRefresh: () => fetchCases(false),
    isConnected,
    initialLoad,
    isFromCache: !loading && !initialLoad && cases.length > 0,
  };
}
