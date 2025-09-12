"use client";

import { useState } from "react";
import Navbar from "../../../components/layouts/Navbar";
import Footer from "../../../components/layouts/Footer";
import Button from "../../../components/ui/Button";

interface Reward {
  id: string;
  challengeId: string;
  challenger: string;
  stake: string;
  reward: string;
  status: "pending" | "claimed";
  claimedAt?: string;
  challengeTitle: string;
}

export default function ACPRewardsPage() {
  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);

  // Mock data - replace with actual data from your contract
  const rewards: Reward[] = [
    {
      id: "1",
      challengeId: "1",
      challenger: "alice@example.com",
      stake: "10 STRK",
      reward: "1.5 STRK",
      status: "pending",
      challengeTitle: "Complete React Course"
    },
    {
      id: "2",
      challengeId: "2", 
      challenger: "bob@example.com",
      stake: "5 STRK",
      reward: "0.75 STRK",
      status: "pending",
      challengeTitle: "Exercise 3x this week"
    },
    {
      id: "3",
      challengeId: "3",
      challenger: "charlie@example.com",
      stake: "15 STRK",
      reward: "2.25 STRK",
      status: "claimed",
      claimedAt: "2024-01-08T10:30:00Z",
      challengeTitle: "Daily Meditation Challenge"
    }
  ];

  const pendingRewards = rewards.filter(reward => reward.status === "pending");
  const claimedRewards = rewards.filter(reward => reward.status === "claimed");
  const totalPendingRewards = pendingRewards.reduce((sum, reward) => 
    sum + parseFloat(reward.reward.replace(" STRK", "")), 0
  );

  const handleSelectReward = (rewardId: string) => {
    setSelectedRewards(prev => 
      prev.includes(rewardId) 
        ? prev.filter(id => id !== rewardId)
        : [...prev, rewardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRewards.length === pendingRewards.length) {
      setSelectedRewards([]);
    } else {
      setSelectedRewards(pendingRewards.map(reward => reward.id));
    }
  };

  const handleClaimRewards = () => {
    if (selectedRewards.length === 0) {
      alert("Please select rewards to claim");
      return;
    }

    // Here you would submit to your Starknet contract
    console.log("Claiming rewards:", selectedRewards);
    
    alert(`Successfully claimed ${selectedRewards.length} reward(s)!`);
    setSelectedRewards([]);
  };

  const getStatusColor = (status: Reward["status"]) => {
    switch (status) {
      case "pending": return "text-yellow-400 bg-yellow-400/10";
      case "claimed": return "text-green-400 bg-green-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusText = (status: Reward["status"]) => {
    switch (status) {
      case "pending": return "Pending Claim";
      case "claimed": return "Claimed";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg relative">
      <Navbar />
      
      {/* Hero Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-purple-500/20 pointer-events-none"></div>
      
      {/* Main Content */}
      <main className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              ACP
              <span className="text-purple-400"> Rewards</span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Claim rewards earned as an Accountability Partner for reviewing proof submissions.
            </p>
          </div>

          {/* Rewards Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{totalPendingRewards.toFixed(2)} STRK</div>
              <div className="text-gray-400">Pending Rewards</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{pendingRewards.length}</div>
              <div className="text-gray-400">Available Claims</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{claimedRewards.length}</div>
              <div className="text-gray-400">Total Claimed</div>
            </div>
          </div>

          {/* Pending Rewards */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Pending Rewards</h2>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="px-4 py-2"
                >
                  {selectedRewards.length === pendingRewards.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="engraved"
                  onClick={handleClaimRewards}
                  disabled={selectedRewards.length === 0}
                  className="px-6 py-2"
                >
                  Claim Selected ({selectedRewards.length})
                </Button>
              </div>
            </div>

            {pendingRewards.length > 0 ? (
              <div className="grid gap-4">
                {pendingRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-6 rounded-2xl border transition-colors cursor-pointer ${
                      selectedRewards.includes(reward.id)
                        ? "bg-accent/20 border-accent"
                        : "bg-gray-800/50 border-[#ffffff1a] hover:border-gray-600"
                    }`}
                    onClick={() => handleSelectReward(reward.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedRewards.includes(reward.id)}
                          onChange={() => handleSelectReward(reward.id)}
                          className="w-5 h-5 text-accent bg-transparent border-2 border-gray-600 rounded focus:ring-accent focus:ring-2"
                        />
                        <div>
                          <h3 className="text-lg font-bold text-white">{reward.challengeTitle}</h3>
                          <p className="text-gray-400 text-sm">Challenger: {reward.challenger}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400">{reward.reward}</div>
                        <div className="text-sm text-gray-400">From {reward.stake} stake</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(reward.status)}`}>
                          {getStatusText(reward.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">No Pending Rewards</h3>
                <p className="text-gray-400">Complete more proof reviews to earn rewards</p>
              </div>
            )}
          </div>

          {/* Claimed Rewards History */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Claimed Rewards History</h2>
            
            {claimedRewards.length > 0 ? (
              <div className="grid gap-4">
                {claimedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{reward.challengeTitle}</h3>
                        <p className="text-gray-400 text-sm">Challenger: {reward.challenger}</p>
                        <p className="text-gray-400 text-sm">
                          Claimed: {new Date(reward.claimedAt!).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-400">{reward.reward}</div>
                        <div className="text-sm text-gray-400">From {reward.stake} stake</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(reward.status)}`}>
                          {getStatusText(reward.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-bold text-white mb-2">No Claimed Rewards Yet</h3>
                <p className="text-gray-400">Your reward history will appear here</p>
              </div>
            )}
          </div>

          {/* Rewards Info */}
          <div className="mt-16 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="font-semibold text-blue-400 mb-4">💡 How ACP Rewards Work</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Earn 15% of the original stake for reviewing proof</li>
                <li>• Rewards are automatically calculated after review</li>
                <li>• Claim rewards individually or in batches</li>
                <li>• Gas fees are deducted from rewards</li>
              </ul>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Fair reviews lead to higher community reputation</li>
                <li>• Disputed reviews may affect future rewards</li>
                <li>• Rewards are paid in STRK tokens</li>
                <li>• All transactions are recorded on Starknet</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
