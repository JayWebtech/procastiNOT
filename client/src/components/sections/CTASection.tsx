import Button from '../ui/Button';

export default function CTASection() {
  return (
    <section className="max-w-4xl mx-auto py-16 text-center">
      <h2 className="text-4xl font-bold mb-6">
        Ready to Stop Making Excuses?
      </h2>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Join thousands of people who finally got their act together by putting their money where their mouth is.
      </p>
      <Button variant="primary" size="lg">
        Start Your First Goal
      </Button>
    </section>
  );
}
