"use client";

import { useState } from "react";
import Navbar from "../../../components/layouts/Navbar";
import Footer from "../../../components/layouts/Footer";
import Button from "../../../components/ui/Button";

interface ProofSubmission {
  id: string;
  taskId: string;
  title: string;
  description: string;
  evidence: string;
  challenger: string;
  stake: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function ACPReviewPage() {
  const [selectedProof, setSelectedProof] = useState<ProofSubmission | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject" | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Mock data - replace with actual data from your contract
  const pendingProofs: ProofSubmission[] = [
    {
      id: "1",
      taskId: "1",
      title: "Complete React Course",
      description: "I completed the React tutorial and built a todo app as requested. The app includes state management, component composition, and proper styling. You can see the live demo at the provided link.",
      evidence: "https://github.com/user/react-todo-app",
      challenger: "alice@example.com",
      stake: "10 STRK",
      submittedAt: "2024-01-10T14:30:00Z",
      status: "pending"
    },
    {
      id: "2", 
      taskId: "2",
      title: "Exercise 3x this week",
      description: "I went to the gym on Monday, Wednesday, and Friday as planned. Each session was at least 45 minutes long and included both cardio and strength training. I have attached gym check-in photos and workout logs.",
      evidence: "https://drive.google.com/fitness-logs-week1",
      challenger: "bob@example.com",
      stake: "5 STRK",
      submittedAt: "2024-01-11T09:15:00Z",
      status: "pending"
    }
  ];

  const handleReview = (decision: "approve" | "reject") => {
    if (!selectedProof) return;
    
    setReviewDecision(decision);
  };

  const handleSubmitReview = () => {
    if (!selectedProof || !reviewDecision || !reviewComment.trim()) {
      alert("Please provide a review comment");
      return;
    }

    // Here you would submit the review to your Starknet contract
    console.log("Submitting review:", {
      proofId: selectedProof.id,
      decision: reviewDecision,
      comment: reviewComment,
      reviewer: "current-acp@example.com" // Get from auth
    });

    alert(`Proof ${reviewDecision === "approve" ? "approved" : "rejected"} successfully!`);
    
    // Reset form
    setSelectedProof(null);
    setReviewDecision(null);
    setReviewComment("");
  };

  const getStatusColor = (status: ProofSubmission["status"]) => {
    switch (status) {
      case "pending": return "text-yellow-400 bg-yellow-400/10";
      case "approved": return "text-green-400 bg-green-400/10";
      case "rejected": return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusText = (status: ProofSubmission["status"]) => {
    switch (status) {
      case "pending": return "Pending Review";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
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
              <span className="text-purple-400"> Review</span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Review proof submissions as an Accountability Partner and make fair decisions.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pending Proofs List */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-white mb-6">Pending Reviews</h2>
              <div className="space-y-4">
                {pendingProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedProof?.id === proof.id
                        ? "bg-accent/20 border-accent"
                        : "bg-gray-800/50 border-[#ffffff1a] hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedProof(proof)}
                  >
                    <h3 className="font-semibold text-white mb-2">{proof.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">From: {proof.challenger}</p>
                    <p className="text-sm text-gray-400 mb-2">Stake: {proof.stake}</p>
                    <p className="text-sm text-gray-400">Submitted: {new Date(proof.submittedAt).toLocaleDateString()}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(proof.status)}`}>
                      {getStatusText(proof.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Panel */}
            <div className="lg:col-span-2">
              {selectedProof ? (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Review: {selectedProof.title}</h3>
                  
                  {/* Challenge Details */}
                  <div className="mb-6 p-4 bg-gray-700/50 rounded-xl">
                    <h4 className="font-semibold text-white mb-3">Challenge Details</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Challenger:</span>
                        <p className="text-white">{selectedProof.challenger}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Stake:</span>
                        <p className="text-white">{selectedProof.stake}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Submitted:</span>
                        <p className="text-white">{new Date(selectedProof.submittedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProof.status)}`}>
                          {getStatusText(selectedProof.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proof Description */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-3">Proof Description</h4>
                    <div className="p-4 bg-gray-700/30 rounded-lg">
                      <p className="text-gray-300 leading-relaxed">{selectedProof.description}</p>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-3">Evidence</h4>
                    <div className="p-4 bg-gray-700/30 rounded-lg">
                      <a 
                        href={selectedProof.evidence} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent-light underline break-all"
                      >
                        {selectedProof.evidence}
                      </a>
                    </div>
                  </div>

                  {/* Review Decision */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-3">Review Decision</h4>
                    <div className="flex gap-4 mb-4">
                      <Button
                        variant={reviewDecision === "approve" ? "primary" : "outline"}
                        onClick={() => handleReview("approve")}
                        className="px-6 py-3"
                      >
                        ✅ Approve
                      </Button>
                      <Button
                        variant={reviewDecision === "reject" ? "primary" : "outline"}
                        onClick={() => handleReview("reject")}
                        className="px-6 py-3"
                      >
                        ❌ Reject
                      </Button>
                    </div>
                  </div>

                  {/* Review Comment */}
                  <div className="mb-6">
                    <label htmlFor="comment" className="block font-semibold text-white mb-3">
                      Review Comment
                    </label>
                    <textarea
                      id="comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-transparent border border-[#ffffff1a] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent transition-colors resize-none"
                      placeholder="Provide detailed feedback on your decision..."
                      required
                    />
                  </div>

                  {/* Submit Review */}
                  <div className="flex gap-4">
                    <Button
                      variant="engraved"
                      onClick={handleSubmitReview}
                      disabled={!reviewDecision || !reviewComment.trim()}
                      className="px-8 py-3"
                    >
                      Submit Review
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProof(null);
                        setReviewDecision(null);
                        setReviewComment("");
                      }}
                      className="px-6 py-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-8 text-center">
                  <p className="text-gray-400 text-lg">Select a proof submission to review</p>
                </div>
              )}
            </div>
          </div>

          {/* Review Guidelines */}
          <div className="mt-16 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-400 mb-4">📋 Review Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Review evidence objectively and fairly</li>
                <li>• Consider the specific requirements of the challenge</li>
                <li>• Provide constructive feedback in your comments</li>
                <li>• Approve only if evidence clearly shows completion</li>
              </ul>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Reject if evidence is insufficient or unclear</li>
                <li>• Consider the stake amount and seriousness</li>
                <li>• Your decision affects both parties financially</li>
                <li>• Disputes can be escalated to community voting</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
