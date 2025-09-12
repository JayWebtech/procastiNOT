import Navbar from '../components/layouts/Navbar';
import Footer from '../components/layouts/Footer';
import HeroSection from '../components/sections/HeroSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import FAQSection from '../components/sections/FAQSection';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground gradient-bg relative">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      {/* <FAQSection /> */}
      <CTASection />
      <Footer />
    </div>
  );
}
