"use client";

import { useState } from "react";
import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import Button from "../../components/ui/Button";

interface Case {
  id: string;
  title: string;
  description: string;
  challenger: string;
  partner: string;
  stake: string;
  status: "disputed" | "voting" | "resolved";
  votesFor: number;
  votesAgainst: number;
  totalStaked: string;
  timeRemaining: string;
  evidence: string;
}

export default function CasesPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "voting" | "resolved">("all");

  // Mock cases data - replace with actual data from your contract
  const mockCases: Case[] = [
    {
      id: "1",
      title: "Disputed: Daily Meditation Challenge",
      description: "Challenge creator claims they meditated daily for 30 days, but accountability partner disputes the evidence provided.",
      challenger: "alice@example.com",
      partner: "bob@example.com", 
      stake: "20 STRK",
      status: "voting",
      votesFor: 15,
      votesAgainst: 8,
      totalStaked: "150 STRK",
      timeRemaining: "2 days",
      evidence: "https://example.com/meditation-evidence"
    },
    {
      id: "2",
      title: "Disputed: Weekly Exercise Challenge",
      description: "Creator claims they exercised 3x per week, partner says evidence is insufficient.",
      challenger: "charlie@example.com",
      partner: "diana@example.com",
      stake: "15 STRK", 
      status: "voting",
      votesFor: 22,
      votesAgainst: 5,
      totalStaked: "200 STRK",
      timeRemaining: "5 hours",
      evidence: "https://example.com/exercise-evidence"
    },
    {
      id: "3",
      title: "Resolved: Coding Challenge",
      description: "Community voted in favor of challenger. Challenge completed successfully.",
      challenger: "eve@example.com",
      partner: "frank@example.com",
      stake: "25 STRK",
      status: "resolved",
      votesFor: 45,
      votesAgainst: 12,
      totalStaked: "300 STRK",
      timeRemaining: "Resolved",
      evidence: "https://example.com/coding-evidence"
    }
  ];

  const filteredCases = mockCases.filter(case_ => 
    activeFilter === "all" || case_.status === activeFilter
  );

  const getStatusColor = (status: Case["status"]) => {
    switch (status) {
      case "disputed": return "text-red-400 bg-red-400/10";
      case "voting": return "text-yellow-400 bg-yellow-400/10";
      case "resolved": return "text-green-400 bg-green-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusText = (status: Case["status"]) => {
    switch (status) {
      case "disputed": return "Disputed";
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
              Community
              <span className="text-purple-400"> Cases</span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Participate in community governance by voting on disputed challenges and staking on outcomes.
            </p>
          </div>

          {/* Community Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">23</div>
              <div className="text-gray-400">Active Cases</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">1,250 STRK</div>
              <div className="text-gray-400">Total Staked</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">156</div>
              <div className="text-gray-400">Active Voters</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-xl p-2 mb-8 max-w-md mx-auto">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All Cases
            </button>
            <button
              onClick={() => setActiveFilter("voting")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeFilter === "voting"
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Active Voting
            </button>
            <button
              onClick={() => setActiveFilter("resolved")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeFilter === "resolved"
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Cases Grid */}
          <div className="grid gap-6">
            {filteredCases.map((case_) => (
              <div
                key={case_.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-8"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{case_.title}</h3>
                    <p className="text-gray-300 mb-4 leading-relaxed">{case_.description}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(case_.status)}`}>
                    {getStatusText(case_.status)}
                  </span>
                </div>

                {/* Case Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-400 text-sm">Challenger:</span>
                      <p className="text-white font-semibold">{case_.challenger}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Accountability Partner:</span>
                      <p className="text-white font-semibold">{case_.partner}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Original Stake:</span>
                      <p className="text-white font-semibold">{case_.stake}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-400 text-sm">Time Remaining:</span>
                      <p className="text-white font-semibold">{case_.timeRemaining}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Total Community Staked:</span>
                      <p className="text-white font-semibold">{case_.totalStaked}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Evidence:</span>
                      <a 
                        href={case_.evidence} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent-light underline"
                      >
                        View Evidence
                      </a>
                    </div>
                  </div>
                </div>

                {/* Voting Stats */}
                <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-white mb-3">Voting Results</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{case_.votesFor}</div>
                      <div className="text-sm text-gray-400">Votes For</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{case_.votesAgainst}</div>
                      <div className="text-sm text-gray-400">Votes Against</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {Math.round((case_.votesFor / (case_.votesFor + case_.votesAgainst)) * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">For</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(case_.votesFor / (case_.votesFor + case_.votesAgainst)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {case_.status === "voting" && (
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary" className="px-6 py-2">
                      Vote For Challenger
                    </Button>
                    <Button variant="outline" className="px-6 py-2">
                      Vote Against
                    </Button>
                    <Button variant="secondary" className="px-6 py-2">
                      Stake & Vote
                    </Button>
                    <Button variant="engraved" className="px-6 py-2">
                      View Full Details
                    </Button>
                  </div>
                )}

                {case_.status === "resolved" && (
                  <div className="flex gap-4">
                    <Button variant="secondary" className="px-6 py-2" disabled>
                      Case Resolved
                    </Button>
                    <Button variant="outline" className="px-6 py-2">
                      View Resolution
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
