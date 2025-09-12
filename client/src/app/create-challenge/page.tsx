"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { getSupportedTokens, getContractAddress } from "../../lib/token";
import {
  formDataToCairo,
  debugTimeData,
  encodeTaskForCairo,
} from "../../lib/cairoContractHelpers";
import {
  validateCompleteChallengeForm,
  validateFieldRealtime,
} from "../../lib/yupValidation";
import { useAccount, useNetwork } from "@starknet-react/core";
import { Call, CallData, byteArray, validateAndParseAddress } from "starknet";
import { useToast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";
import { challengesAPI, handleApiError } from "../../lib/axios";
import { useRouter } from "next/navigation";
import ChallengeSuccessModal from "../../components/ChallengeSuccessModal";

export default function CreateChallengePage() {
  const [formData, setFormData] = useState({
    email: "",
    taskDescription: "",
    accountabilityPartnerEmail: "",
    accountabilityPartnerWallet: "",
    timeLocked: "",
    amount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMainnet, setIsMainnet] = useState(true);
  const [txHash, setTxHash] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const networkWarningShown = useRef(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdChallengeData, setCreatedChallengeData] = useState<any>(null);

  const { address, account } = useAccount();
  const { chain } = useNetwork();
  const toast = useToast();
  const router = useRouter();
  const CONTRACT_ADDRESS = lea(isMainnet);
  const SUPPORTED_TOKENS = getSupportedTokens(isMainnet);

  const durationOptions = [
    { value: "10", label: "10 Minutes" }, // 10 minutes
    { value: "15", label: "15 Minutes" }, // 15 minutes
    { value: "20", label: "20 Minutes" }, // 20 minutes
    { value: "25", label: "25 Minutes" }, // 25 minutes
    { value: "30", label: "30 Minutes" }, // 30 minutes
    { value: "60", label: "1 Hour" }, // 60 minutes
    { value: "120", label: "2 Hours" }, // 120 minutes
    { value: "240", label: "4 Hours" }, // 240 minutes
    { value: "480", label: "8 Hours" }, // 480 minutes (work day)
    { value: "720", label: "12 Hours" }, // 720 minutes
    { value: "1440", label: "1 Day" }, // 1440 minutes
    { value: "2880", label: "2 Days" }, // 2880 minutes
    { value: "4320", label: "3 Days" }, // 4320 minutes
    { value: "10080", label: "1 Week" }, // 10080 minutes
    { value: "20160", label: "2 Weeks" }, // 20160 minutes
    { value: "43200", label: "1 Month" }, // 43200 minutes (30 days)
    { value: "86400", label: "2 Months" }, // 86400 minutes (60 days)
    { value: "129600", label: "3 Months" }, // 129600 minutes (90 days)
  ];

  const handleInputChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation for immediate feedback
    if (value.trim() !== "") {
      const error = await validateFieldRealtime(name, value);
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    } else {
      // Clear error if field is empty
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleInputBlur = async (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Validate on blur for better UX
    const error = await validateFieldRealtime(name, value);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  // Network detection - only run once when chain changes
  useEffect(() => {
    if (!chain) return;

    const isMainnetNetwork = chain.network === "mainnet";
    setIsMainnet(isMainnetNetwork);

    // Allow both mainnet and testnet for now
    // if (!isMainnetNetwork && !networkWarningShown.current) {
    //   networkWarningShown.current = true;
    //   toast.error({
    //     title: 'Testnet Detected',
    //     message: 'You are currently on Testnet. Switch to Starknet Mainnet to create real challenges.',
    //   });
    // } else if (isMainnetNetwork) {
    //   networkWarningShown.current = false;
    // }
  }, [chain?.network]); // Only depend on chain.network, not the entire chain object

  // Fetch user email when wallet is connected
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!address) return;

      try {
        console.log("🔍 Fetching email for wallet:", address);
        const response = await challengesAPI.getUserEmail(address);

        if (response.data.success && response.data.data?.email) {
          console.log("✅ Found user email:", response.data.data.email);
          setFormData((prev) => ({
            ...prev,
            email: response.data.data.email,
          }));
        } else {
          console.log("ℹ️ No email found for this wallet address");
        }
      } catch (error: any) {
        // Don't show error toast for 404 (no email found)
        if (error.response?.status !== 404) {
          console.error("❌ Error fetching user email:", error);
        } else {
          console.log("ℹ️ No previous challenges found for this wallet");
        }
      }
    };

    fetchUserEmail();
  }, [address]);

  const validateForm = async () => {
    // Convert form data to proper types for validation
    const validationData = {
      ...formData,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
    };

    const validation = await validateCompleteChallengeForm(
      validationData,
      address,
      account,
      isMainnet
    );

    if (!validation.isValid) {
      // Set field errors for display
      setFieldErrors(validation.errors);

      // Show the first error in toast
      const firstError = Object.values(validation.errors)[0];

      toast.error({
        title: "Validation Error",
        message: firstError,
      });

      return false;
    }

    // Clear any existing field errors
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    try {
      setIsLoading(true);

      // Prepare challenge data for Cairo contract
      const cairoData = formDataToCairo({
        ...formData,
        creatorWallet: address!,
      });

      if (!cairoData.is_valid) {
        toast.error({
          title: "Invalid Parameters",
          message: "Invalid challenge parameters",
        });
        return;
      }

      // Debug time data for development
      debugTimeData(cairoData);

      // Convert amount to contract format (wei-like)
      const stakeAmount = BigInt(
        Math.floor(parseFloat(formData.amount) * 1e18)
      );
      const low = stakeAmount & BigInt("0xffffffffffffffffffffffffffffffff");
      const high = stakeAmount >> BigInt(128);

      // Convert time limit to seconds (Cairo expects seconds)
      const timeLimit =
        Math.floor(Date.now() / 1000) + parseInt(formData.timeLocked) * 60;

      // Convert task description to ByteArray (using shortString for now)
      //const encodedTask = encodeTaskForCairo(formData.taskDescription);
      const taskBytes = byteArray.byteArrayFromString(formData.taskDescription);

      console.log("Creating challenge with:", {
        acp: formData.accountabilityPartnerWallet,
        stakeAmount: stakeAmount.toString(),
        task: taskBytes,
        timeLimit,
        contractAddress: CONTRACT_ADDRESS,
      });

      // Prepare contract calls
      const calls: Call[] = [
        {
          entrypoint: "approve",
          contractAddress: SUPPORTED_TOKENS.STRK.address as `0x${string}`,
          calldata: [
            CONTRACT_ADDRESS as `0x${string}`,
            low.toString(),
            high.toString(),
          ],
        },
        {
          entrypoint: "create_challenge",
          contractAddress: CONTRACT_ADDRESS as `0x${string}`,
          calldata: CallData.compile([
            formData.accountabilityPartnerWallet,
            { low: low.toString(), high: high.toString() }, // u256 as struct
            taskBytes, // ByteArray - CallData.compile handles serialization
            timeLimit.toString(),
          ]),
        },
      ];

      // Execute the transaction
      const result = await account!.execute(calls);
      const txHash = result?.transaction_hash;
      setTxHash(txHash);

      toast.success({
        title: "Transaction Submitted",
        message: "Challenge creation transaction submitted!",
      });

      // Wait for transaction confirmation
      const receipt = await account!.waitForTransaction(txHash);
      console.log("📦 Receipt:", receipt.events);

      if (receipt?.statusReceipt === "success") {
        // Extract challenge_id from contract events
        let challengeId = 0;

        function normalizeAddress(address: any) {
            if (!address) return '0x0';
            
            // Remove 0x prefix
            let cleaned = address.replace('0x', '').toLowerCase();
            
            // Remove leading zeros
            cleaned = cleaned.replace(/^0+/, '');
            
            // If all were zeros, keep one zero
            if (cleaned === '') cleaned = '0';
            
            return '0x' + cleaned;
        }
        
        // Normalize the target address once
        const normalizedContractAddress = normalizeAddress(CONTRACT_ADDRESS);
        
        console.log("=== Logging all event addresses before filtering ===");
        receipt.events.forEach((e: any, index: any) => {
            const normalizedEventAddress = normalizeAddress(e.from_address);
            console.log(`Event ${index}:`, {
                from_address: e.from_address,
                normalized: normalizedEventAddress,
                target_original: CONTRACT_ADDRESS,
                target_normalized: normalizedContractAddress,
                match: normalizedEventAddress === normalizedContractAddress
            });
        });
        
        const contractEvents = receipt.events.filter((e: any) => 
            normalizeAddress(e.from_address) === normalizedContractAddress  // Use normalized target
        );
        
        console.log("🔍 Contract events:", contractEvents);
        
        if (contractEvents.length > 0) {
            challengeId = parseInt(contractEvents[0].data[0], 16);
            console.log("✅ Challenge ID:", challengeId);
        } else {
            console.log("❌ No contract events found");
        }

        if (contractEvents.length > 0) {
          challengeId = parseInt(contractEvents[0].data[0], 16);
      }
  

        if (challengeId === 0) {
          console.warn(
            "⚠️ Could not extract challenge_id from events, using 0 as fallback"
          );
        }

        // Prepare data for backend API
        const challengeData = {
          creator_email: formData.email,
          creator_wallet: address || "",
          task_description: formData.taskDescription,
          accountability_partner_email: formData.accountabilityPartnerEmail,
          accountability_partner_wallet: formData.accountabilityPartnerWallet,
          stake_amount: parseFloat(formData.amount),
          duration_minutes: parseInt(formData.timeLocked),
          transaction_hash: txHash,
          challenge_id: challengeId,
        };

        console.log("📤 Backend API data:", challengeData);

        // Send to backend API
        try {
          const response = await challengesAPI.createChallenge(challengeData);

          if (response.status === 200 || response.status === 201) {
            console.log(
              "✅ Challenge data sent to backend successfully:",
              response.data
            );
          }
        } catch (error: any) {
          console.error("❌ Failed to send challenge data to backend:", error);
          const errorMessage = handleApiError(error);
          toast.error({
            title: "Backend Error",
            message: `Challenge created on blockchain but failed to save to backend: ${errorMessage}`,
          });
        }

        // Show success modal with challenge data
        const durationText = durationOptions.find(
          (option) => option.value === formData.timeLocked
        )?.label || `${formData.timeLocked} minutes`;

        setCreatedChallengeData({
          id: challengeId,
          task: formData.taskDescription,
          stake_amount: parseFloat(formData.amount),
          duration: durationText,
          transaction_hash: txHash,
          creator_email: formData.email,
        });
        setShowSuccessModal(true);

        // Reset form on success
        // setFormData({
        //   email: "",
        //   taskDescription: "",
        //   accountabilityPartnerEmail: "",
        //   accountabilityPartnerWallet: "",
        //   timeLocked: "",
        //   amount: "",
        // });
      } else {
        toast.error({
          title: "Transaction Failed",
          message: "Transaction failed",
        });
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error({
        title: "Challenge Creation Failed",
        message:
          error instanceof Error
            ? `Challenge creation failed: ${error.message}`
            : "Challenge creation failed with unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg relative">
      <Navbar type="create-challenge" />

      {/* Hero Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-purple-500/20 pointer-events-none"></div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}

          {/* 2-Column Layout */}
          <div className="grid lg:grid-cols-6 gap-12 items-start">
            {/* Left Column - Form */}
            <div className=" col-span-4 backdrop-blur-sm border border-[#ffffff1a] rounded-2xl p-8">
              <div className="mb-12">
                <h1 className="text-4xl md:text-4xl font-bold mb-6 leading-tight">
                  Create Your
                  <span className="text-purple-400"> Challenge</span>
                  <span className="text-white">.</span>
                </h1>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Your Email */}
                  <div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="your.email@example.com"
                      required
                      label="Your Email"
                      description="Used to send you notifications and updates"
                    />
                    {fieldErrors.email && (
                      <p className="text-red-400 text-sm mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="0.1"
                      required
                      min="0.1"
                      step="0.1"
                      label="Stake Amount (STRK)"
                      description="How much you're willing to lose if you fail"
                    />
                    {fieldErrors.amount && (
                      <p className="text-red-400 text-sm mt-1">
                        {fieldErrors.amount}
                      </p>
                    )}
                  </div>
                </div>

                {/* Task Description */}
                <div>
                  <Textarea
                    id="taskDescription"
                    name="taskDescription"
                    value={formData.taskDescription}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    required
                    rows={2}
                    placeholder="Describe your goal in detail. Be specific about what success looks like..."
                    label="Task Description"
                    description='Be specific! "Exercise 3 times a week" is better than "Get fit"'
                    resize="none"
                  />
                  {fieldErrors.taskDescription && (
                    <p className="text-red-400 text-sm mt-1">
                      {fieldErrors.taskDescription}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Accountability Partner Email */}
                  <div>
                    <Input
                      id="accountabilityPartnerEmail"
                      name="accountabilityPartnerEmail"
                      type="email"
                      value={formData.accountabilityPartnerEmail}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="partner@example.com"
                      required
                      label="Accountability Partner Email"
                      description="Someone who will verify your progress"
                    />
                    {fieldErrors.accountabilityPartnerEmail && (
                      <p className="text-red-400 text-sm mt-1">
                        {fieldErrors.accountabilityPartnerEmail}
                      </p>
                    )}
                  </div>

                  {/* Accountability Partner Wallet */}
                  <div>
                    <Input
                      id="accountabilityPartnerWallet"
                      name="accountabilityPartnerWallet"
                      type="text"
                      value={formData.accountabilityPartnerWallet}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="0x..."
                      required
                      label="Partner's Wallet Address"
                      description="Where they'll receive your stake if you fail"
                    />
                    {fieldErrors.accountabilityPartnerWallet && (
                      <p className="text-red-400 text-sm mt-1">
                        {fieldErrors.accountabilityPartnerWallet}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time Locked */}
                <div>
                  <Select
                    id="timeLocked"
                    name="timeLocked"
                    value={formData.timeLocked}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    options={durationOptions}
                    required
                    placeholder="Select duration"
                    label="Challenge Duration"
                    description="How long do you have to complete your goal?"
                  />
                  {fieldErrors.timeLocked && (
                    <p className="text-red-400 text-sm mt-1">
                      {fieldErrors.timeLocked}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="text-center pt-8">
                  <Button
                    type="submit"
                    variant="engraved"
                    className="px-12 py-4 text-lg w-full flex justify-center items-center"
                    disabled={
                      isLoading ||
                      !address ||
                      Object.keys(fieldErrors).length > 0
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Creating Challenge...
                      </>
                    ) : (
                      "Create Challenge"
                    )}
                  </Button>
                </div>

                {/* Transaction Hash Display */}
                {txHash && (
                  <div className="bg-purple-500/5 border border-purple-500/30 rounded-xl p-4">
                    <h4 className="font-semibold text-green-400 mb-2">
                      ✅ Transaction Submitted
                    </h4>
                    <p className="text-gray-300 text-sm break-all">
                      Hash: {txHash}
                    </p>
                    <a
                      href={`https://${
                        isMainnet ? "voyager" : "sepolia.voyager"
                      }.online/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                      View on Explorer
                    </a>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column - Instructions */}
            <div className="bg-gray-800/50 col-span-4 md:col-span-2 backdrop-blur-sm rounded-2xl space-y-4">
              {/* Wallet Connection Status */}
              {fieldErrors.wallet && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-400 mb-2">
                    🔗 Wallet Required
                  </h4>
                  <p className="text-gray-300 text-sm">{fieldErrors.wallet}</p>
                </div>
              )}

              {/* Network Status */}
              {fieldErrors.network && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h4 className="font-semibold text-red-400 mb-2">
                    ⚠️ Network Issue
                  </h4>
                  <p className="text-gray-300 text-sm">{fieldErrors.network}</p>
                </div>
              )}

              {/* Network Info */}
              {!isMainnet && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">
                    🧪 Testnet Mode
                  </h4>
                  <p className="text-gray-300 text-sm">
                    You're on testnet. Challenges created here are for testing
                    purposes.
                  </p>
                </div>
              )}

              {/* Important Reminders */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-red-400 mb-2">
                  ⚠️ Important Reminders
                </h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>
                    • Your stake will be locked until challenge completion
                  </li>
                  <li>• Failed challenges transfer stake to your partner</li>
                  <li>• Successful challenges return stake plus rewards</li>
                  <li>• Choose a trustworthy accountability partner</li>
                  <li>• Set realistic timelines and measurable goals</li>
                  <li>
                    • All transactions are recorded on Starknet blockchain
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      {createdChallengeData && (
        <ChallengeSuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          challengeData={createdChallengeData}
        />
      )}
    </div>
  );
}
