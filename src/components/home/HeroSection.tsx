import { Button } from "@/components/ui/button";
import GetStartedBtn from "@/home/get-started-btn";

export function HeroSection() {
  return (
    <section className="py-24 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          The first
          truly intelligent <br />
          Project Management
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Skyrocket your online store conversion rate and improve the customer journey with smart online visual merchandising.
        </p>
        <div className="flex gap-4 justify-center">
          <GetStartedBtn />
          <Button size="sm" variant="outline">View Demo</Button>
        </div>
      </div>
    </section>
  );
} 