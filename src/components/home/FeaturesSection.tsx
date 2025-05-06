import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { 
  EnhancedCard as Card,
  EnhancedCardHeader as CardHeader,
  EnhancedCardTitle as CardTitle,
  EnhancedCardContent as CardContent,
} from "@/components/enhanced-card";

const features = [
  {
    title: "Skyrocket conversion rate",
    description: "Increase online store conversion by 15% with our online visual merchandising tool kit.",
    icon: TrendingUp
  },
  {
    title: "Increase average order value",
    description: "Improve the average order value as your online store up to 15% yearly",
    icon: DollarSign
  },
  {
    title: "Spend less time for management",
    description: "Cut your dashboard spend time less than managing the inline store catalog",
    icon: Clock
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Get Everything Done</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} variant="feature" className="border-none bg-background">
              <CardHeader>
                <feature.icon className="w-12 h-12 mb-4 text-primary" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 