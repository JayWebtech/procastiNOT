"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useNetwork } from '@starknet-react/core';
import { Call, CallData, byteArray } from "starknet";
import Navbar from "../../../components/layouts/Navbar";
import Footer from "../../../components/layouts/Footer";
import Button from "../../../components/ui/Button";
import Textarea from "../../../components/ui/Textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../hooks/useToast";
import { getContractAddress } from "@/lib/token";

export default function ProofSubmissionPage() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge_id');
  const [isMainnet, setIsMainnet] = useState(true);
  

  
  const { address, account } = useAccount();
  const {chain} = useNetwork();
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!chain) return;

    const isMainnetNetwork = chain.network === "mainnet";
    setIsMainnet(isMainnetNetwork);

  }, [chain?.network]);


  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-ipfs', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        // Store the IPFS URL for display
        setIpfsUrl(result.ipfsUrl || `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}`);
        return result.ipfsHash;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challengeId) {
      toast.error({
        title: "Missing Challenge ID",
        message: "No challenge ID provided in the URL",
      });
      return;
    }

    if (!uploadedFile) {
      toast.error({
        title: "Missing File",
        message: "Please upload a file as evidence for your challenge completion",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload file to IPFS
      const proofCid = await handleFileUpload(uploadedFile);
      const fullFileUrl = ipfsUrl || `https://gateway.pinata.cloud/ipfs/${proofCid}`;

      // Submit to contract
      if (account && proofCid) {
        const CONTRACT_ADDRESS = getContractAddress(isMainnet);
        
        // Convert full file URL to ByteArray
        const proofBytes = byteArray.byteArrayFromString(fullFileUrl);
        
        // Prepare contract call
        const call: Call = {
          entrypoint: "submit_proof",
          contractAddress: CONTRACT_ADDRESS as `0x${string}`,
          calldata: CallData.compile([
            challengeId, // challenge_id: u64
            proofBytes, // proof_cid: ByteArray
          ]),
        };

        // Execute the transaction
        const result = await account.execute(call);
        const txHash = result?.transaction_hash;
        setTxHash(txHash);

        toast.success({
          title: "Transaction Submitted",
          message: "Proof submission transaction submitted!",
        });

        // Wait for transaction confirmation
        const receipt = await account.waitForTransaction(txHash);
        console.log("📦 Receipt:", receipt);

        if (receipt?.statusReceipt === "success") {
          // Notify backend to send email to ACP
          try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/notify-acp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                challengeId: parseInt(challengeId),
                proofCid: fullFileUrl
              })
            });

            toast.success({
              title: "Proof Submitted Successfully",
              message: "Your accountability partner will review it.",
            });
            
            // Close the tab after a short delay
            setTimeout(() => {
              window.close();
            }, 2000);
          } catch (backendError) {
            console.error('Backend notification failed:', backendError);
            toast.error({
              title: "Backend Notification Failed",
              message: "Proof submitted to contract but failed to notify ACP",
            });
          }
        } else {
          toast.error({
            title: "Transaction Failed",
            message: "Proof submission transaction failed",
          });
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error({
        title: "Submission Failed",
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg relative">
      <Navbar type="dashboard" />
      
      {/* Hero Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-purple-500/20 pointer-events-none"></div>
      
      {/* Main Content */}
      <main className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Submit
              <span className="text-purple-400"> Proof</span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Provide evidence of your challenge completion for review by your accountability partner.
            </p>
          </div>

          {/* Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-8">
            {challengeId && (
              <div className="mb-6 p-4 bg-accent/10 border border-purple-400/20 rounded-xl">
                <h3 className="font-semibold text-accent mb-2">Challenge Details</h3>
                <div className="text-gray-300 space-y-1">
                  <p><strong>Challenge ID:</strong> {challengeId}</p>
                  <p className="text-sm text-gray-400">Submit your proof for this challenge</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmitProof} className="space-y-8">

          
              {/* File Upload */}
              <div>
                <label htmlFor="file" className="block text-lg font-semibold text-white mb-3">
                  Upload Evidence File
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-transparent border border-[#ffffff1a] rounded-lg text-white focus:outline-none focus:border-accent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-dark"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Upload a file (image, video, document) that proves you completed the challenge
                </p>
              </div>


              {/* Guidelines */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <h4 className="font-semibold text-yellow-400 mb-2">📋 Proof Guidelines</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Be specific and detailed in your description</li>
                  <li>• Provide clear, verifiable evidence</li>
                  <li>• Include timestamps when relevant</li>
                  <li>• Your accountability partner will review your submission</li>
                  <li>• False submissions may result in stake forfeiture</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-8">
                <Button
                  type="submit"
                  variant="engraved"
                  className="px-12 py-4 text-lg w-full flex justify-center items-center"
                  disabled={!challengeId || !uploadedFile || isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Submitting Proof...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Uploading to IPFS...
                    </>
                  ) : (
                    "Submit Proof"
                  )}
                </Button>
              </div>
            </form>

            {/* IPFS Upload Success */}
            {ipfsUrl && (
              <div className="mt-6 bg-green-500/5 border border-green-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-green-400 mb-2">
                  ✅ File Uploaded to IPFS
                </h4>
                <p className="text-gray-300 text-sm break-all">
                  <strong>IPFS URL:</strong> <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">{ipfsUrl}</a>
                </p>
              </div>
            )}

            {/* Transaction Hash Display */}
            {txHash && (
              <div className="mt-6 bg-purple-500/5 border border-purple-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-green-400 mb-2">
                  ✅ Transaction Submitted
                </h4>
                <p className="text-gray-300 text-sm break-all">
                  <strong>Hash:</strong> {txHash}
                </p>
                <a
                  href={`https://${isMainnet ? "voyager" : "sepolia.voyager"}.online/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
