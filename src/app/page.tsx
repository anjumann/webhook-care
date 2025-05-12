import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CatalogSection } from "@/components/home/CatalogSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { FreeTrialSection } from "@/components/home/FreeTrialSection";
import Header from "@/components/header";
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
    </main>
  );
}