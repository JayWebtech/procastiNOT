"use client";

import { useState } from "react";
import Navbar from "../../../components/layouts/Navbar";
import Footer from "../../../components/layouts/Footer";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

interface StakingCase {
  id: string;
  title: string;
  description: string;
  challenger: string;
  partner: string;
  originalStake: string;
  status: "voting" | "resolved";
  votesFor: number;
  votesAgainst: number;
  totalStaked: string;
  timeRemaining: string;
  evidence: string;
  userStake: string;
  userVote: "for" | "against" | null;
}

export default function StakingPage() {
  const [selectedCase, setSelectedCase] = useState<StakingCase | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [voteChoice, setVoteChoice] = useState<"for" | "against" | null>(null);

  // Mock data - replace with actual data from your contract
  const stakingCases: StakingCase[] = [
    {
      id: "1",
      title: "Disputed: Daily Meditation Challenge",
      description: "Challenge creator claims they meditated daily for 30 days, but accountability partner disputes the evidence provided.",
      challenger: "alice@example.com",
      partner: "bob@example.com",
      originalStake: "20 STRK",
      status: "voting",
      votesFor: 15,
      votesAgainst: 8,
      totalStaked: "150 STRK",
      timeRemaining: "2 days",
      evidence: "https://example.com/meditation-evidence",
      userStake: "5 STRK",
      userVote: "for"
    },
    {
      id: "2",
      title: "Disputed: Weekly Exercise Challenge", 
      description: "Creator claims they exercised 3x per week, partner says evidence is insufficient.",
      challenger: "charlie@example.com",
      partner: "diana@example.com",
      originalStake: "15 STRK",
      status: "voting",
      votesFor: 22,
      votesAgainst: 5,
      totalStaked: "200 STRK",
      timeRemaining: "5 hours",
      evidence: "https://example.com/exercise-evidence",
      userStake: "0 STRK",
      userVote: null
    }
  ];

  const handleStakeAndVote = () => {
    if (!selectedCase || !stakeAmount || !voteChoice) {
      alert("Please select a case, enter stake amount, and choose your vote");
      return;
    }

    // Here you would submit to your Starknet contract
    console.log("Staking and voting:", {
      caseId: selectedCase.id,
      stakeAmount,
      vote: voteChoice,
      user: "current-user@example.com"
    });

    alert(`Successfully staked ${stakeAmount} STRK and voted ${voteChoice}!`);
    
    // Reset form
    setStakeAmount("");
    setVoteChoice(null);
  };

  const getStatusColor = (status: StakingCase["status"]) => {
    switch (status) {
      case "voting": return "text-yellow-400 bg-yellow-400/10";
      case "resolved": return "text-green-400 bg-green-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusText = (status: StakingCase["status"]) => {
    switch (status) {
      case "voting": return "Voting Active";
      case "resolved": return "Resolved";
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
              Stake &
              <span className="text-purple-400"> Vote</span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Participate in community governance by staking on case outcomes and voting on disputed challenges.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cases List */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Active Cases</h2>
              
              {stakingCases.map((case_) => (
                <div
                  key={case_.id}
                  className={`p-6 rounded-2xl border cursor-pointer transition-colors ${
                    selectedCase?.id === case_.id
                      ? "bg-accent/20 border-accent"
                      : "bg-gray-800/50 border-[#ffffff1a] hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedCase(case_)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{case_.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(case_.status)}`}>
                      {getStatusText(case_.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">{case_.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Challenger:</span>
                        <span className="text-white text-sm">{case_.challenger}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Partner:</span>
                        <span className="text-white text-sm">{case_.partner}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Original Stake:</span>
                        <span className="text-white text-sm">{case_.originalStake}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Your Stake:</span>
                        <span className="text-accent text-sm">{case_.userStake}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Your Vote:</span>
                        <span className={`text-sm ${
                          case_.userVote === "for" ? "text-green-400" : 
                          case_.userVote === "against" ? "text-red-400" : 
                          "text-gray-400"
                        }`}>
                          {case_.userVote === "for" ? "For" : 
                           case_.userVote === "against" ? "Against" : 
                           "Not voted"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Time Left:</span>
                        <span className="text-white text-sm">{case_.timeRemaining}</span>
                      </div>
                    </div>
                  </div>

                  {/* Voting Stats */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-400">{case_.votesFor}</div>
                        <div className="text-xs text-gray-400">For</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-400">{case_.votesAgainst}</div>
                        <div className="text-xs text-gray-400">Against</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{case_.totalStaked}</div>
                        <div className="text-xs text-gray-400">Total Staked</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Staking Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 sticky top-8">
                <h3 className="text-xl font-bold text-white mb-6">Stake & Vote</h3>
                
                {selectedCase ? (
                  <div className="space-y-6">
                    {/* Case Summary */}
                    <div className="p-4 bg-gray-700/30 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">{selectedCase.title}</h4>
                      <p className="text-gray-400 text-sm">Original Stake: {selectedCase.originalStake}</p>
                      <p className="text-gray-400 text-sm">Time Left: {selectedCase.timeRemaining}</p>
                    </div>

                    {/* Stake Amount */}
                    <Input
                      id="stakeAmount"
                      name="stakeAmount"
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0"
                      min="0.1"
                      step="0.1"
                      label="Stake Amount (STRK)"
                      description="Minimum 0.1 STRK to participate"
                    />

                    {/* Vote Choice */}
                    <div>
                      <label className="block text-lg font-semibold text-white mb-3">
                        Vote Choice
                      </label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setVoteChoice("for")}
                          className={`w-full p-4 rounded-lg border transition-colors ${
                            voteChoice === "for"
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-green-500"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-xl mb-1">✅</div>
                            <div className="font-semibold">Vote For Challenger</div>
                            <div className="text-sm opacity-75">Evidence supports completion</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setVoteChoice("against")}
                          className={`w-full p-4 rounded-lg border transition-colors ${
                            voteChoice === "against"
                              ? "bg-red-500/20 border-red-500 text-red-400"
                              : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-red-500"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-xl mb-1">❌</div>
                            <div className="font-semibold">Vote Against</div>
                            <div className="text-sm opacity-75">Evidence insufficient</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      variant="engraved"
                      onClick={handleStakeAndVote}
                      disabled={!stakeAmount || !voteChoice}
                      className="w-full py-3"
                    >
                      Stake & Vote
                    </Button>

                    {/* Risk Warning */}
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <h4 className="font-semibold text-red-400 mb-2 text-sm">⚠️ Risk Warning</h4>
                      <ul className="text-gray-300 text-xs space-y-1">
                        <li>• You may lose your stake if you vote incorrectly</li>
                        <li>• Rewards are distributed based on voting accuracy</li>
                        <li>• Review evidence carefully before voting</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Select a case to stake and vote</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="mt-16 grid md:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">1,250</div>
              <div className="text-gray-400">Total Staked (STRK)</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">156</div>
              <div className="text-gray-400">Active Voters</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">23</div>
              <div className="text-gray-400">Active Cases</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">78%</div>
              <div className="text-gray-400">Avg. Accuracy</div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
