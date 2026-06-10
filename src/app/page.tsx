import Header from "@/components/header";
import Footer from "@/components/footer";
import { HeroSection } from "@/components/home/HeroSection";
import { BentoFeatures } from "@/components/home/BentoFeatures";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FinalCta } from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <BentoFeatures />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}
