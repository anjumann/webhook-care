import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CatalogSection } from "@/components/home/CatalogSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { FreeTrialSection } from "@/components/home/FreeTrialSection";

export default function HomePage() {
  return (
    <main>
      <div className="container mx-auto px-4">
        <Header />
      </div>
      <HeroSection />
      <FeaturesSection />
      <CatalogSection />
      <FeaturesGrid />
      {/* TODO: Add testimonials section when we have some reviews 🎃*/}
      {/* <TestimonialsSection /> */}
      <FreeTrialSection />
      <Footer />
    </main>
  );
}