"use client";

import { useState } from "react";
import Button from "./ui/Button";
import { X, Twitter, Copy, Check } from "lucide-react";

interface ChallengeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeData: {
    id: number;
    task: string;
    stake_amount: number;
    duration: string;
    transaction_hash: string;
    creator_email: string;
  };
}

export default function ChallengeSuccessModal({
  isOpen,
  onClose,
  challengeData,
}: ChallengeSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `🚀 I just created a challenge on ProcastiNOT! 

📋 Task: ${challengeData.task}
💰 Stake: ${challengeData.stake_amount} STRK
⏰ Duration: ${challengeData.duration}
🆔 Challenge ID: ${challengeData.id}

Join me in staying accountable! #ProcastiNOT #Accountability #Blockchain`;

  const shareUrl = `https://procastinot.com/challenge/${challengeData.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="border border-purple-400/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Challenge Created! 🎉
          </h2>
          <p className="text-gray-300">
            Your accountability challenge is now live on the blockchain
          </p>
        </div>

        {/* Challenge Flyer */}
        <div className="mb-6 relative overflow-hidden">


          <div className="relative z-10">
            
            {/* Challenge Details */}
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-purple-400/20">
                <h4 className="text-white font-semibold mb-2">📋 Challenge</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {challengeData.task}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 ">
                <div className="bg-black/30 rounded-xl p-4 border border-purple-400/20">
                  <h4 className="text-white font-semibold mb-1">💰 Stake</h4>
                  <p className="text-green-400 font-bold">
                    {challengeData.stake_amount} STRK
                  </p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-purple-400/20">
                  <h4 className="text-white font-semibold mb-1">⏰ Duration</h4>
                  <p className="text-blue-400 font-bold">
                    {challengeData.duration}
                  </p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 border border-purple-400/20">
                <h4 className="text-white font-semibold mb-1">🆔 Challenge ID</h4>
                <p className="text-purple-400 font-mono text-sm">
                  #{challengeData.id}
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-6">
              <p className="text-gray-300 text-sm mb-2">
                Ready to stay accountable?
              </p>
              <p className="text-white font-semibold">
                Join the challenge at ProcastiNOT.com
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={handleTwitterShare}
              variant="primary"
              className="flex-1 flex items-center justify-center text-xs gap-2 py-2"
            >
              <Twitter className="h-5 w-5" />
              Share on Twitter
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex items-center justify-center text-xs gap-2 py-2"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full py-3"
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Transaction Hash */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-xs text-center">
            Transaction: {challengeData.transaction_hash.slice(0, 20)}...
          </p>
        </div>
      </div>
    </div>
  );
}
