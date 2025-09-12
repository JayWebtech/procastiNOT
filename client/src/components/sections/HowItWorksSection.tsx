import ScrollReveal from "../ScrollReveal";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto md:px-0 px-4 py-16">
      <ScrollReveal
        containerClassName=""
        textClassName="text-white"
        baseOpacity={0}
        enableBlur={true}
        baseRotation={0}
        blurStrength={30}
      >
        💰 Stake money on your goal. No more "I'll start tomorrow" when tomorrow costs you real $$.

        Actually do the thing. Your wallet becomes your personal trainer.

        Win? Get money back + rewards. Lose? Community gets your stake. Either way, you learn something about yourself.
      </ScrollReveal>
    </section>
  );
}
