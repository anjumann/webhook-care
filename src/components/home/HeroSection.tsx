import { Button } from "@/components/ui/button";
import GetStartedBtn from "@/home/get-started-btn";
import { Highlight } from "@/components/ui/Highlight";

export function HeroSection() {
  return (
    <section
      className="py-24 text-center"
    >
      <div className="container mx-auto px-4">
        <h1
          className="text-5xl font-bold tracking-tight mb-6"
        >
          Stop Wrestling with Webhooks.<br />Start Catching Them.
        </h1>
        <p
          className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Instantly create <Highlight>disposable webhook URLs</Highlight>, inspect every payload <Highlight>with ease</Highlight>, customize responses, and <Highlight>forward requests to your local dev environment</Highlight>. Spend less time debugging and more time building.
        </p>
        <div
          className="flex gap-4 justify-center"
        >
          <GetStartedBtn />
          <Button size="sm" variant="outline">View Docs</Button>
        </div>
      </div>
    </section>
  );
} 