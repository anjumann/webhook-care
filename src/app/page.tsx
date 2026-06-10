import Header from "@/components/header";
import Footer from "@/components/footer";
import { HeroSection } from "@/components/home/HeroSection";
import { LogoMarquee } from "@/components/home/LogoMarquee";
import { FeatureCards } from "@/components/home/FeatureCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { DemoPlayground } from "@/components/home/DemoPlayground";
import { Testimonials } from "@/components/home/Testimonials";
import { FinalCta } from "@/components/home/FinalCta";

/**
 * Landing page — dark-glass marketing surface. The `dark` class forces the
 * dark token ramp for this subtree regardless of the user's theme; the glass
 * design language (globals.css §landing) is dark-only by design.
 */
export default function HomePage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <LogoMarquee />
      <FeatureCards />
      <HowItWorks />
      <DemoPlayground />
      <Testimonials />
      <FinalCta />
      <Footer />
    </main>
  );
}
