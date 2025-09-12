"use client";

import { useState, useEffect } from "react";
import Button from "./ui/Button";
import Select from "./ui/Select";
import { X, Loader2 } from "lucide-react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { CallData } from "starknet";
import { useToast } from "../hooks/useToast";
import { getContractAddress, getSupportedTokens } from "@/lib/token";

interface JurorEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    id: number;
    challenge_id: number;
    task: string;
    stake_amount: number;
    status: string;
  };
}

export default function JurorEnrollmentModal({
  isOpen,
  onClose,
  caseData,
}: JurorEnrollmentModalProps) {
  const [selectedVote, setSelectedVote] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { account, address } = useAccount();
  const toast = useToast();
  const [isMainnet, setIsMainnet] = useState(false);
  const SUPPORTED_TOKENS = getSupportedTokens(isMainnet);
  const CONTRACT_ADDRESS = getContractAddress(isMainnet);
  const { chain } = useNetwork();

  if (!isOpen) return null;

  // Calculate juror stake (stake_amount / 5)
  const jurorStake = caseData.stake_amount / 5;

  const voteOptions = [
    { value: "agree", label: "Agree with Accountability Partner" },
    { value: "disagree", label: "Disagree with Accountability Partner" },
  ];

  const handleEnroll = async () => {
    if (!account || !address) {
      toast.error({
        title: "Error",
        message: "Wallet not connected"
      });
      return;
    }

    if (!selectedVote) {
      toast.error({
        title: "Selection Required",
        message: "Please select your vote before enrolling"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Convert vote to boolean
      const vote = selectedVote === "agree";

      toast.info({
        title: "Enrolling as Juror",
        message: "Please confirm the transaction in your wallet..."
      });

      // Prepare contract call using the same method as create-challenge
      const calls = [
        {
          entrypoint: "approve",
          contractAddress: SUPPORTED_TOKENS.STRK.address as `0x${string}`,
          calldata: [
            CONTRACT_ADDRESS as `0x${string}`,
            (BigInt(Math.floor(jurorStake * 1e18)) & BigInt("0xffffffffffffffffffffffffffffffff")).toString(),
            (BigInt(Math.floor(jurorStake * 1e18)) >> BigInt(128)).toString(),
          ],
        },
        {
          entrypoint: "juror_vote",
          contractAddress: CONTRACT_ADDRESS as `0x${string}`,
          calldata: CallData.compile([
            caseData.id.toString(),
            vote.toString(),
          ]),
        },
      ];

      // Execute the transaction
      const result = await account.execute(calls);
      const txHash = result?.transaction_hash;
      
      console.log("✅ Juror enrollment transaction:", result);
      
      toast.success({
        title: "Transaction Submitted",
        message: "Juror enrollment transaction submitted!"
      });

      // Wait for transaction confirmation
      const receipt = await account.waitForTransaction(txHash);
      
      if (receipt?.statusReceipt === "success") {
        toast.success({
          title: "Successfully Enrolled",
          message: `You've been enrolled as a juror for Case #${caseData.id}!`
        });

        // Close modal and refresh cases
        onClose();
      } else {
        toast.error({
          title: "Transaction Failed",
          message: "Juror enrollment transaction failed"
        });
      }

    } catch (error: any) {
      console.error("❌ Error enrolling as juror:", error);
      toast.error({
        title: "Enrollment Failed",
        message: error.message || "Failed to enroll as juror"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chain) {
      setIsMainnet(chain.network === "mainnet");
    }
  }, [chain]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="bg-accent/50 border border-purple-400/20 rounded-3xl p-8 max-w-lg w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Enroll as Juror
          </h2>
          <p className="text-gray-300 text-sm">
            Case #{caseData.id} - Challenge #{caseData.challenge_id}
          </p>
        </div>

        {/* Case Details */}
        <div className="bg-gray-800/50 rounded-xl mb-6">
          <h3 className="text-white font-semibold mb-2">Case Details</h3>
          <p className="text-gray-300 text-sm mb-3">{caseData.task}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Stake:</span>
              <p className="text-white font-semibold">{caseData.stake_amount} STRK</p>
            </div>
            <div>
              <span className="text-gray-400">Your Stake:</span>
              <p className="text-green-400 font-semibold">{jurorStake} STRK</p>
            </div>
          </div>
        </div>

        {/* Vote Selection */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">
            Who do you support?
          </label>
          <Select
            id="vote"
            name="vote"
            value={selectedVote}
            onChange={(e) => setSelectedVote(e.target.value)}
            options={voteOptions}
            placeholder="Select your vote"
            required
          />
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-yellow-400 mb-2">
            ⚠️ Important Notice
          </h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• You will stake {jurorStake} STRK to participate</li>
            <li>• If you vote with the majority, you get your stake back plus rewards</li>
            <li>• If you vote with the minority, you lose your stake</li>
            <li>• Your vote is final and cannot be changed</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 py-3"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            variant="primary"
            className="flex-1 py-3 flex items-center justify-center gap-2"
            disabled={isLoading || !selectedVote}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Enrolling...
              </>
            ) : (
              `Enroll & Stake ${jurorStake} STRK`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
