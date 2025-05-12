import { Button } from "@/components/ui/button";
import GetStartedBtn from "@/home/get-started-btn";

export function HeroSection() {
  return (
    <section className="py-24 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Modern Webhook Testing & Debugging
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Instantly create endpoints, inspect incoming requests, and forward webhooks to multiple destinations. Built for developers who want fast, reliable, and insightful webhook workflows.
        </p>
        <div className="flex gap-4 justify-center">
          <GetStartedBtn />
          <Button size="sm" variant="outline">View Docs</Button>
        </div>
      </div>
    </section>
  );
} 