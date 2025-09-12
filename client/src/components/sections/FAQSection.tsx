export default function FAQSection() {
  const faqs = [
    {
      question: "What if I actually want to procrastinate?",
      answer: "Then this platform is perfect for you! You'll either stop procrastinating (because money) or you'll lose money (which is also a form of motivation). It's a win-win, really."
    },
    {
      question: "How much should I stake?",
      answer: "Start small. Maybe the cost of your favorite coffee. If that doesn't work, try the cost of your rent. If that doesn't work, try the cost of your dignity. (We're not responsible for the last one.)"
    },
    {
      question: "What if my goal is to procrastinate less?",
      answer: "That's... actually a really good goal. Stake money on not procrastinating, and if you procrastinate, you lose the money. It's like a reverse procrastination paradox, but it works."
    }
  ];

  return (
    <section id="faq" className="max-w-4xl mx-auto py-16">
      <h2 className="text-4xl font-bold text-center mb-16">
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-gray-800 dark:bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold mb-3">{faq.question}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
