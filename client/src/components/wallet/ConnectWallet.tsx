import { ReactNode } from "react";
import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
} from "@starknet-react/core";
import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";
import { useToast } from "../../hooks/useToast";
import Link from "next/link";

export default function Button({ className }: { className?: string }) {
  const { disconnect } = useDisconnect();
  const toast = useToast();

  const { connect, connectors } = useConnect();
  const { address } = useAccount();

  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
  });

  async function connectWallet() {
    const { connector } = await starknetkitConnectModal();
    try {
      if (connector) {
        connect({ connector: connector as Connector });
      } else {
        toast.error({
          title: "No Wallet Found",
          message:
            "No wallet connectors found. Please make sure Argent or Braavos is installed.",
          duration: 6000,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error({
        title: "Connection Failed",
        message: "Failed to connect wallet. Please try again.",
        duration: 6000,
      });
    }
  }

  if (!address) {
    return (
      <button
        onClick={connectWallet}
        className={`font-medium transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed btn-engraved px-6 py-3 text-sm ${className}`}
      >
        Connect wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm bg-purple-400/10 border border-purple-400/50 px-6 py-3 rounded-full hidden md:flex items-center justify-center">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
      <Link href="/dashboard">
        <button
          className={`font-medium transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed btn-engraved px-6 py-3 text-sm ${className}`}
        >
          Dashboard
        </button>
      </Link>
    </div>
  );
}
