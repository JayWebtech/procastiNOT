"use client";

import { useState } from "react";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import Link from "next/link";
import ConnectWallet from "../wallet/ConnectWallet";
import { useAccount } from "@starknet-react/core";

export default function Navbar({ type }: { type?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  return (
    <header className="relative z-10 px-6 py-4 md:px-12 md:py-6">
      <div className="max-w-6xl mx-auto border border-[#ffffff1a] px-3 py-2 rounded-full">
        <div className="flex items-center">
          {/* Logo */}
          <div className="flex-1">
            <Logo />
          </div>
          {type !== "create-challenge" && (
            <nav className="hidden md:flex justify-center items-center gap-8 flex-1">
              <a
                href="#how-it-works"
                className="hover:text-accent-light transition-colors"
              >
                How It Works
              </a>
              <a
                href="#features"
                className="hover:text-accent-light transition-colors"
              >
                Features
              </a>
            </nav>
          )}

          {/* CTA Button */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <ConnectWallet />

            {type !== "create-challenge" && !isConnected && (
              <Link href="/create-challenge">
                <Button variant="engraved" className="hidden md:block">
                  Launch $pp
                </Button>
              </Link>
            )}
            {/* Mobile Menu Button */}
            {/* <button
              className="md:hidden flex flex-col gap-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span
                className={`w-6 h-0.5 bg-white transition-all ${
                  isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-white transition-all ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-white transition-all ${
                  isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              ></span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-purple-400/10 z-[99] border-t border-gray-700 md:hidden">
          <div className="max-w-6xl mx-auto px-6">
            <nav className="flex py-6 gap-4">
              <a
                href="#how-it-works"
                className="hover:text-accent-light transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#features"
                className="hover:text-accent-light transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
