import Button from "../ui/Button";
import CurvedLoop from "../CurvedLoop";
import Link from "next/link";

export default function HeroSection() {
  return (
    <main className="px-6 md:px-12 py-16 md:py-24 relative z-10">
      {/* Hero Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-purple-500/20 pointer-events-none"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-400/10 border border-purple-400/50 px-3 py-2 rounded-full mb-8">
          <span className="bg-accent text-white px-2 py-1 rounded-full text-xs font-medium">
            2025
          </span>
          <span className="text-sm text-gray-300 dark:text-gray-300">
            Anti-Procrastination Protocol
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Stop Procrastinating
          <span className="text-purple-400"> with Money on the Line</span>
          <span className="text-white">.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Finally, a way to make your future self pay for your current self's
          laziness. Stake money on your goals. Succeed and get rewards. Fail and
          lose your stake.
          <span className="text-accent-light font-semibold">
            {" "}
            
          </span>
        </p>

        <Link href="/create-challenge">
          <Button variant="engraved">Create Challenge</Button>
        </Link>

        <CurvedLoop
          marqueeText="No excuses ✦ No delays ✦ On Starknet."
          speed={5}
          className="text-[8rem]"
        />
      </div>
    </main>
  );
}
