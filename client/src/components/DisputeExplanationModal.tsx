"use client";

import Button from "./ui/Button";
import { X, Users, Vote, Trophy, AlertTriangle } from "lucide-react";

interface DisputeExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: () => void;
  challengeData: {
    task: string;
    stake_amount: number;
  };
}

export default function DisputeExplanationModal({
  isOpen,
  onClose,
  onConfirmReject,
  challengeData,
}: DisputeExplanationModalProps) {
  if (!isOpen) return null;

  const jurorStake = challengeData.stake_amount / 5;
  const jurorReward = jurorStake * 1.6; // Each winning juror gets ~60% profit

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4">5
      <div className="bg-accent/50 border border-purple-400/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Rejecting This Proof? 🤔
          </h2>
          <p className="text-gray-300">
            Here's what happens when you reject - the case automatically goes to a jury
          </p>
        </div>

        {/* Current Challenge Info */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            📋 Current Challenge
          </h3>
          <p className="text-gray-300 mb-4">{challengeData.task}</p>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-400 text-sm">Stake Amount:</span>
              <p className="text-green-400 font-bold text-lg">{challengeData.stake_amount} STRK</p>
            </div>
          </div>
        </div>

        {/* The Flow */}
        <div className="space-y-6 mb-8">
          <h3 className="text-2xl font-bold text-white text-center mb-6">
            Here's How The Jury Decision Process Works 🏛️
          </h3>

          {/* Step 1 */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">You Reject → Automatic Jury Decision</h4>
                <p className="text-gray-300 text-sm">
                  When you reject their proof, the case automatically goes to a jury of 5 peers for voting. 
                  The challenger cannot dispute - the jury will decide if your rejection was fair.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  5 Jurors Join The Case
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  Each juror must stake their share to participate in the voting:
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-white font-semibold">
                    👉 Total Stake: {challengeData.stake_amount} STRK
                  </p>
                  <p className="text-yellow-400 font-semibold">
                    👉 Each Juror Stakes: {challengeData.stake_amount} ÷ 5 = {jurorStake} STRK
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Secret Voting Process
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  Each juror secretly votes either:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-600/20 rounded-lg p-3">
                    <p className="text-green-400 font-semibold">✅ "Approve Challenger"</p>
                    <p className="text-gray-400 text-xs">The proof is valid</p>
                  </div>
                  <div className="bg-red-600/20 rounded-lg p-3">
                    <p className="text-red-400 font-semibold">❌ "Support ACP (You)"</p>
                    <p className="text-gray-400 text-xs">The rejection was correct</p>
                  </div>
                </div>
                <p className="text-yellow-400 text-sm mt-3 font-semibold">
                  🔒 Votes are hidden until all 5 jurors vote - no copying!
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Results & Rewards
                </h4>
                <p className="text-gray-300 text-sm mb-4">
                  Majority decides (3 or more votes). Here's what happens:
                </p>
                
                <div className="space-y-4">
                  {/* Scenario 1 */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h5 className="text-white font-semibold mb-2">
                      📊 Example: 3 jurors support you, 2 support challenger
                    </h5>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• The 3 correct jurors each get {jurorStake} STRK back + share of losing stakes</li>
                      <li>• The 2 wrong jurors lose their {jurorStake} STRK</li>
                      <li>• You (ACP) get the full {challengeData.stake_amount} STRK from challenger</li>
                      <li>• Each winning juror walks away with ~{jurorReward.toFixed(1)} STRK ({(jurorReward - jurorStake).toFixed(1)} STRK profit)</li>
                    </ul>
                  </div>

                  {/* Scenario 2 */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h5 className="text-white font-semibold mb-2">
                      📊 If all 5 jurors agree (unanimous)
                    </h5>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• All jurors just get their stakes back (no profit)</li>
                      <li>• Winner gets the main stake ({challengeData.stake_amount} STRK)</li>
                      <li>• This prevents jurors from colluding for easy profits</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Points */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            ⚠️ Important: Why This System Works
          </h4>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• <strong>Vote right → win more than you staked</strong></li>
            <li>• <strong>Vote wrong → lose your stake</strong></li>
            <li>• <strong>Everyone has skin in the game</strong> - ensures fair judgment</li>
            <li>• <strong>Hidden votes</strong> prevent copying and collusion</li>
            <li>• <strong>Only genuine task completion</strong> gets rewarded</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 py-3"
          >
            Cancel - Let Me Reconsider
          </Button>
          <Button
            onClick={onConfirmReject}
            variant="primary"
            className="flex-1 py-3 bg-red-600 hover:bg-red-700"
          >
            I Understand - Proceed with Rejection
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-xs text-center">
            💡 Remember: Only reject if you're confident the proof doesn't meet the requirements. 
            The jury will automatically decide if your rejection was fair!
          </p>
        </div>
      </div>
    </div>
  );
}
