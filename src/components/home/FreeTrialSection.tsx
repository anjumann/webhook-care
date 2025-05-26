import GetStartedBtn from "@/home/get-started-btn";
import { Highlight } from "@/components/ui/Highlight";

export function FreeTrialSection() {
  return (
    <section 
      className="container mx-auto flex flex-col items-center justify-center px-4 "
    >
      <div 
        className="text-center space-y-6 flex flex-col items-center"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Start Testing Webhooks <span className="text-primary">for Free</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
          Instantly create endpoints, inspect requests, forward webhooks, and debug with ease. <Highlight>No sign-up, no credit card required.</Highlight> <Highlight>Jumpstart your webhook development now.</Highlight>
        </p>
        <div className="flex justify-center md:justify-start mt-6">
          <GetStartedBtn />
        </div>
      </div>
    </section>
  );
} 