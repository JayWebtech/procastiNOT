import ScrollStack, { ScrollStackItem } from "../ScrollStack";

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-6xl mx-auto md:px-0 px-4">
      <ScrollStack useWindowScroll={true}>
        <ScrollStackItem itemClassName="bg-purple-400/10 p-8 rounded-xl border border-purple-400/30">
          <h3 className="text-3xl font-bold mb-6 text-accent-light">
            🚀 Built on Starknet
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            No gas fees that cost more than your actual goal. No waiting for blocks like you're waiting for motivation to strike. Just fast, cheap, and reliable goal-staking.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Ultra-low transaction costs (pennies, not dollars)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Lightning-fast confirmations (seconds, not minutes)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Built for the future of finance</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Ethereum security with L2 efficiency</span>
            </li>
          </ul>
        </ScrollStackItem>
        
        <ScrollStackItem itemClassName="bg-blue-400/20 p-8 rounded-xl border border-blue-400/30">
          <h3 className="text-3xl font-bold mb-6 text-blue-400">
            ⚡ Instant Settlements
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            No waiting around for your rewards. When you succeed, you get paid immediately. When you fail... well, that's immediate too.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Real-time goal verification</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Automatic reward distribution</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Smart contract enforcement</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>No human intervention needed</span>
            </li>
          </ul>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="bg-red-400/20 p-8 rounded-xl border border-red-400/30">
          <h3 className="text-3xl font-bold mb-6 text-red-400">
            🎯 Flexible Goal Types
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            From fitness goals to learning new skills, from quitting bad habits to starting good ones - stake money on anything that matters to you.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Fitness & health goals</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Learning & skill development</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Habit breaking & building</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Creative & personal projects</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Custom goal categories</span>
            </li>
          </ul>
        </ScrollStackItem>
      </ScrollStack>
    </section>
  );
}
