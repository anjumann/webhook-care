import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const features = [
  "No coding needed. Plug & Play",
  "All eCommerce platforms supported"
];

export function FreeTrialSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="bg-muted rounded-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Try Chainlist For Free!</h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-1">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button size="sm">Request demo</Button>
            </div>
            <div className="bg-background rounded-lg aspect-video"></div>
          </div>
        </div>
      </div>
    </section>
  );
} 