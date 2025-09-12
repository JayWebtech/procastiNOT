"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useNetwork, useContract } from "@starknet-react/core";
import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import Button from "../../components/ui/Button";
import { useContractData, Challenge } from "../../hooks/useContractData";
import { useAcpData } from "../../hooks/useAcpData";
import { useCasesData, Case } from "../../hooks/useCasesData";
import JurorEnrollmentModal from "../../components/JurorEnrollmentModal";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "../../hooks/useToast";
import { CallData } from "starknet";
import { getContractAddress } from "@/lib/token";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"tasks" | "cases" | "acp">(
    "tasks"
  );
  const acpFetchedRef = useRef(false);
  const casesFetchedRef = useRef(false);
  const [showJurorModal, setShowJurorModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const { address, account } = useAccount();
  const { chain } = useNetwork();
  const [isMainnet, setIsMainnet] = useState(false);
  const CONTRACT_ADDRESS = getContractAddress(isMainnet);

  // Use the contract data hook for user's challenges
  const {
    challenges,
    loading: contractLoading,
    error: contractError,
    refetch: refetchChallenge,
    isConnected,
  } = useContractData();

  // Use the ACP data hook for challenges where user is ACP
  const {
    challenges: acpChallenges,
    loading: acpLoading,
    error: acpError,
    refetch: refetchAcpChallenge,
    hasFetched: acpHasFetched,
  } = useAcpData();

  // Use the cases data hook for community cases
  const {
    cases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
    initialLoad: casesInitialLoad,
  } = useCasesData();

  
  const toast = useToast();

  // Fetch ACP data only when ACP tab is selected for the first time
  useEffect(() => {
    if (
      activeTab === "acp" &&
      address &&
      !acpFetchedRef.current &&
      !acpLoading
    ) {
      acpFetchedRef.current = true;
      refetchAcpChallenge();
    }
  }, [activeTab, address, acpLoading, refetchAcpChallenge]);

  // Fetch cases data only when cases tab is selected for the first time
  useEffect(() => {
    if (
      activeTab === "cases" &&
      address &&
      !casesFetchedRef.current &&
      !casesLoading
    ) {
      casesFetchedRef.current = true;
      refetchCases();
    }
  }, [activeTab, address, casesLoading, refetchCases]);

  // Reset the fetch flags when address changes
  useEffect(() => {
    acpFetchedRef.current = false;
    casesFetchedRef.current = false;
  }, [address]);

  // ACP approve function
  const handleApproveProof = async (challengeId: number) => {
    if (!account || !address) {
      toast.error({
        title: "Error",
        message: "Wallet not connected"
      });
      return;
    }

    try {
      toast.info({
        title: "Approving Proof",
        message: "Please confirm the transaction in your wallet..."
      });

      // Prepare contract call using the same method as create-challenge
      const calls = [
        {
          entrypoint: "acp_approve",
          contractAddress: CONTRACT_ADDRESS as `0x${string}`,
          calldata: CallData.compile([challengeId.toString()]),
        },
      ];

      // Execute the transaction
      const result = await account.execute(calls);
      const txHash = result?.transaction_hash;
      
      console.log("✅ ACP approve transaction:", result);
      
      toast.success({
        title: "Transaction Submitted",
        message: "Approval transaction submitted!"
      });

      // Wait for transaction confirmation
      const receipt = await account.waitForTransaction(txHash);
      
      if (receipt?.statusReceipt === "success") {
        toast.success({
          title: "Proof Approved",
          message: "The proof has been successfully approved!"
        });

        // Refresh ACP challenges after approval
        setTimeout(() => {
          refetchAcpChallenge();
        }, 2000);
      } else {
        toast.error({
          title: "Transaction Failed",
          message: "Approval transaction failed"
        });
      }

    } catch (error: any) {
      console.error("❌ Error approving proof:", error);
      toast.error({
        title: "Approval Failed",
        message: error.message || "Failed to approve proof"
      });
    }
  };

  // ACP reject function
  const handleRejectProof = async (challengeId: number) => {
    if (!account || !address) {
      toast.error({
        title: "Error",
        message: "Wallet not connected"
      });
      return;
    }

    try {
      toast.info({
        title: "Rejecting Proof",
        message: "Please confirm the transaction in your wallet..."
      });

      // Prepare contract call using the same method as create-challenge
      const calls = [
        {
          entrypoint: "acp_reject",
          contractAddress: CONTRACT_ADDRESS as `0x${string}`,
          calldata: CallData.compile([challengeId.toString()]),
        },
      ];

      // Execute the transaction
      const result = await account.execute(calls);
      const txHash = result?.transaction_hash;
      
      console.log("✅ ACP reject transaction:", result);
      
      toast.success({
        title: "Transaction Submitted",
        message: "Rejection transaction submitted!"
      });

      // Wait for transaction confirmation
      const receipt = await account.waitForTransaction(txHash);
      
      if (receipt?.statusReceipt === "success") {
        toast.success({
          title: "Proof Rejected",
          message: "The proof has been rejected!"
        });

        // Refresh ACP challenges after rejection
        setTimeout(() => {
          refetchAcpChallenge();
        }, 2000);
      } else {
        toast.error({
          title: "Transaction Failed",
          message: "Rejection transaction failed"
        });
      }

    } catch (error: any) {
      console.error("❌ Error rejecting proof:", error);
      toast.error({
        title: "Rejection Failed",
        message: error.message || "Failed to reject proof"
      });
    }
  };

  const handleEnrollAsJuror = (case_: Case) => {
    setSelectedCase(case_);
    setShowJurorModal(true);
  };

  const handleCloseJurorModal = () => {
    setShowJurorModal(false);
    setSelectedCase(null);
    // Refresh cases after enrollment
    if (refetchCases) {
      refetchCases();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Created":
        return "text-green-400 bg-green-400/10";
      case "Locked":
        return "text-yellow-400 bg-yellow-400/10";
      case "ACPApproved":
        return "text-blue-400 bg-blue-400/10";
      case "ACPRejected":
        return "text-red-400 bg-red-400/10";
      case "Disputed":
        return "text-orange-400 bg-orange-400/10";
      case "Resolved":
        return "text-purple-400 bg-purple-400/10";
      case "active":
        return "text-green-400 bg-green-400/10";
      case "completed":
        return "text-blue-400 bg-blue-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      case "pending_proof":
        return "text-yellow-400 bg-yellow-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Created":
        return "Created";
      case "Locked":
        return "Locked";
      case "ACPApproved":
        return "ACP Approved";
      case "ACPRejected":
        return "ACP Rejected";
      case "Disputed":
        return "Disputed";
      case "Resolved":
        return "Resolved";
      case "JurorEnrollment":
        return "Juror Enrollment";
      case "VotePhase":
        return "Vote Phase";
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "pending_proof":
        return "Proof Pending";
      default:
        return status;
    }
  };

  useEffect(() => {
    if (chain) {
      setIsMainnet(chain.network === "mainnet");
    }
  }, [chain]);

  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg relative">
      <Navbar type="dashboard" />

      {/* Hero Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-purple-500/20 pointer-events-none"></div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your
              <span className="text-purple-400"> Dashboard</span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl leading-relaxed">
              Manage your challenges, submit proof, and track your progress.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-xl p-2 mb-8">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex-1 py-2 px-3 md:py-3 md:px-4 rounded-lg text-xs md:font-medium transition-colors ${
                activeTab === "tasks"
                  ? "btn-engraved text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab("acp")}
              className={`flex-1 py-2 px-3 md:py-3 md:px-4 rounded-lg text-xs md:font-medium transition-colors ${
                activeTab === "acp"
                  ? "btn-engraved text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ACP Reviews
            </button>
            <button
              onClick={() => setActiveTab("cases")}
              className={`flex-1 py-2 px-3 md:py-3 md:px-4 rounded-lg text-xs md:font-medium transition-colors ${
                activeTab === "cases"
                  ? "btn-engraved text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Cases
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-md md:text-2xl font-bold text-white">
                   Active Tasks
                </h2>
                <Link href={"/create-challenge"}>
                  {" "}
                  <Button variant="engraved" className="md:px-6 md:py-2 px-3 py-2 text-xs">
                    Create New Challenge
                  </Button>
                </Link>
              </div>

              {contractLoading && (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin h-8 w-8 text-purple-400 mx-auto" />
                </div>
              )}

              {contractError && (
                <div className="text-center py-8">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <h4 className="font-semibold text-red-400 mb-2">
                      ⚠️ Error Loading Challenge
                    </h4>
                    <p className="text-gray-300 text-sm">{contractError}</p>
                    <Button
                      variant="outline"
                      className="mt-3 px-4 py-2"
                      onClick={() => refetchChallenge()}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {!contractLoading &&
                !contractError &&
                challenges.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      No active challenges found
                    </div>
                    <p className="text-gray-500 mb-6">
                      You don't have any active challenges yet. Create your
                      first challenge to get started!
                    </p>
                    <Button
                      variant="primary"
                      className="px-6 py-2"
                      onClick={() =>
                        (window.location.href = "/create-challenge")
                      }
                    >
                      Create Your First Challenge
                    </Button>
                  </div>
                )}

              <div className="grid gap-6">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Challenge #{challenge.id}
                        </h3>
                        <p className="text-gray-300 mb-4">{challenge.task}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          challenge.status
                        )}`}
                      >
                        {getStatusText(challenge.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Stake Amount:
                          </span>
                          <p className="text-white font-semibold">
                            {challenge.stake_amount.toFixed(4)} STRK
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            ACP Address:
                          </span>
                          <p className="text-white font-semibold text-xs break-all">
                            {String(challenge?.acp || "")}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Created:
                          </span>
                          <p className="text-white font-semibold">
                            {new Date(
                              challenge.created_at * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Deadline:
                          </span>
                          <p className="text-white font-semibold">
                            {new Date(
                              challenge.time_limit * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-400 text-sm">Status:</span>
                          <p className="text-white font-semibold">
                            {getStatusText(challenge.status)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            ACP Decision At:
                          </span>
                          <p className="text-white font-semibold">
                            {challenge.acp_decision_at > 0
                              ? new Date(
                                  challenge.acp_decision_at * 1000
                                ).toLocaleDateString()
                              : "Not decided yet"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Dispute Raised At:
                          </span>
                          <p className="text-white font-semibold">
                            {challenge.dispute_raised_at > 0
                              ? new Date(
                                  challenge.dispute_raised_at * 1000
                                ).toLocaleDateString()
                              : "No dispute"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Proof CID:
                          </span>
                          <p className="text-white font-semibold text-xs break-all">
                            {challenge.proof_cid && challenge.proof_cid !== "0"
                              ? (                            <a
                                href={`https://ipfs.io/ipfs/${String(challenge.proof_cid)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 font-semibold text-xs break-all underline cursor-pointer transition-colors"
                              >
                                {String(challenge.proof_cid)}
                              </a>)
                              : "No proof submitted"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {challenge.status === "Created" && (
                        <Button
                          variant="primary"
                          className="px-4 py-2"
                          onClick={() =>
                            window.open(
                              `/dashboard/proof?challenge_id=${challenge.id}`,
                              "_blank"
                            )
                          }
                        >
                          Submit Proof
                        </Button>
                      )}
                      {challenge.status === "Locked" && (
                        <Button
                          variant="secondary"
                          className="px-4 py-2"
                          disabled
                        >
                          Proof Under Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "acp" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">ACP Reviews</h2>
                <Button
                  variant="outline"
                  className="md:px-6 md:py-2 px-3 py-2 text-xs"
                  onClick={() => refetchAcpChallenge()}
                  disabled={acpLoading}
                >
                  {acpLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>

              {acpLoading && !acpHasFetched && (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin h-8 w-8 text-purple-400 mx-auto" />
                  <p className="text-gray-400 mt-2">
                    Loading ACP challenges...
                  </p>
                </div>
              )}

              {acpError && (
                <div className="text-center py-8">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <h4 className="font-semibold text-red-400 mb-2">
                      ⚠️ Error Loading ACP Challenge
                    </h4>
                    <p className="text-gray-300 text-sm">{acpError}</p>
                    <Button
                      variant="outline"
                      className="mt-3 px-4 py-2"
                      onClick={() => refetchAcpChallenge()}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {!acpLoading &&
                !acpError &&
                acpChallenges.length === 0 &&
                acpHasFetched && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      No ACP challenges to review
                    </div>
                    <p className="text-gray-500">
                      You haven't been assigned as an accountability partner
                      yet.
                    </p>
                  </div>
                )}

              <div className="grid gap-6">
                {acpChallenges.map((acpChallenge) => (
                  <div
                    key={acpChallenge.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Challenge #{acpChallenge.id}
                        </h3>
                        <p className="text-gray-300 mb-4">
                          {acpChallenge.task}
                        </p>
                        <p className="text-gray-400 text-sm">
                          From: {String(acpChallenge.staker || "").slice(0, 8)}
                          ...
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          acpChallenge.status
                        )}`}
                      >
                        {getStatusText(acpChallenge.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Stake Amount:
                          </span>
                          <p className="text-white font-semibold">
                            {acpChallenge.stake_amount.toFixed(4)} STRK
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Creator Address:
                          </span>
                          <p className="text-white font-semibold text-xs break-all">
                            {String(acpChallenge.staker || "")}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Created:
                          </span>
                          <p className="text-white font-semibold">
                            {new Date(
                              acpChallenge.created_at * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Deadline:
                          </span>
                          <p className="text-white font-semibold">
                            {new Date(
                              acpChallenge.time_limit * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-400 text-sm">Status:</span>
                          <p className="text-white font-semibold">
                            {getStatusText(acpChallenge.status)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            ACP Decision At:
                          </span>
                          <p className="text-white font-semibold">
                            {acpChallenge.acp_decision_at > 0
                              ? new Date(
                                  acpChallenge.acp_decision_at * 1000
                                ).toLocaleDateString()
                              : "Not decided yet"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Dispute Raised At:
                          </span>
                          <p className="text-white font-semibold">
                            {acpChallenge.dispute_raised_at > 0
                              ? new Date(
                                  acpChallenge.dispute_raised_at * 1000
                                ).toLocaleDateString()
                              : "No dispute"}
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm">
                            Proof CID:
                          </span>
                          {acpChallenge.proof_cid &&
                          acpChallenge.proof_cid !== "0" ? (
                            <a
                              href={`https://ipfs.io/ipfs/${String(acpChallenge.proof_cid)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-semibold text-xs break-all underline cursor-pointer transition-colors"
                            >
                              {String(acpChallenge.proof_cid)}
                            </a>
                          ) : (
                            <p className="text-white font-semibold text-xs break-all">
                              No proof submitted
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {acpChallenge.status === "Locked" && (
                        <>
                          <Button 
                            variant="primary" 
                            className="px-4 py-2"
                            onClick={() => handleApproveProof(acpChallenge.id)}
                          >
                            Approve Proof
                          </Button>
                          <Button 
                            variant="outline" 
                            className="px-4 py-2"
                            onClick={() => handleRejectProof(acpChallenge.id)}
                          >
                            Reject Proof
                          </Button>
                        </>
                      )}
                      {acpChallenge.status === "Created" && (
                        <Button
                          variant="secondary"
                          className="px-4 py-2"
                          disabled
                        >
                          Waiting for Proof
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "cases" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  Community Cases
                </h2>
                <Button
                  variant="outline"
                  onClick={() => refetchCases()}
                  disabled={casesLoading}
                  className="md:px-6 md:py-2 px-3 py-2 text-xs"
                >
                  {casesLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>

              {casesLoading && casesInitialLoad ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-purple-400" />
                  <span className="ml-2 text-gray-300">Loading cases...</span>
                </div>
              ) : casesError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <h3 className="font-semibold text-red-400 mb-2">
                    Error Loading Cases
                  </h3>
                  <p className="text-gray-300 text-sm">{casesError}</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Community Cases
                  </h3>
                  <p className="text-gray-300">
                    There are currently no disputed cases requiring community voting.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {cases.map((case_) => (
                    <div
                      key={case_.id}
                      className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            Case #{case_.id}
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Challenge ID: {case_.challenge_id}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            case_.status
                          )}`}
                        >
                          {getStatusText(case_.status)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <span className="text-gray-400 text-sm">Task:</span>
                        <p className="text-white font-medium mt-1">
                          {case_.task}
                        </p>
                      </div>

                      <div className="mb-4">
                        <span className="text-gray-400 text-sm">Proof CID:</span>
                        {case_.proof_cid && case_.proof_cid !== "0" ? (
                          <a
                            href={`https://ipfs.io/ipfs/${String(case_.proof_cid)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-semibold text-xs break-all underline cursor-pointer transition-colors block mt-1"
                          >
                            {String(case_.proof_cid)}
                          </a>
                        ) : (
                          <p className="text-white font-semibold text-xs break-all mt-1">
                            No proof submitted
                          </p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-gray-400 text-sm">Stake Amount:</span>
                          <p className="text-white font-semibold">
                            {case_.stake_amount} STRK
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Jurors:</span>
                          <p className="text-blue-400 font-semibold">
                            {case_.jurors}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Total Votes:</span>
                          <p className="text-green-400 font-semibold">
                            {case_.total_votes}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Juror Stake:</span>
                          <p className="text-white font-semibold">
                            {case_.total_juror_stake} STRK
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <p className="text-white">
                            {new Date(case_.created_at * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Enrollment Ends:</span>
                          <p className="text-white">
                            {new Date(case_.enrollment_end * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {case_.status === "JurorEnrollment" && (
                        <div className="flex gap-4">
                          <Button 
                            variant="primary" 
                            className="px-4 py-2"
                            onClick={() => handleEnrollAsJuror(case_)}
                          >
                            Enroll as Juror
                          </Button>
                        </div>
                      )}
                      {case_.status === "VotePhase" && (
                        <div className="flex gap-4">
                          <Button variant="primary" className="px-4 py-2">
                            Vote For
                          </Button>
                          <Button variant="outline" className="px-4 py-2">
                            Vote Against
                          </Button>
                        </div>
                      )}
                      {case_.status === "Resolved" && (
                        <div className="flex gap-4">
                          <Button variant="secondary" className="px-4 py-2" disabled>
                            Case Resolved
                          </Button>
                          <Button variant="outline" className="px-4 py-2">
                            View Result
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Juror Enrollment Modal */}
      {selectedCase && (
        <JurorEnrollmentModal
          isOpen={showJurorModal}
          onClose={handleCloseJurorModal}
          caseData={selectedCase}
        />
      )}
    </div>
  );
}
