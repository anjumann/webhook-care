import { Activity, Send, BarChart2, Download, FlaskConical, UserCircle } from "lucide-react";
import { 
  EnhancedCard as Card,
  EnhancedCardHeader as CardHeader,
  EnhancedCardTitle as CardTitle,
  EnhancedCardContent as CardContent,
} from "@/components/enhanced-card";

const features = [
  {
    title: "Create Webhook Endpoints",
    description: "Instantly spin up unique webhook endpoints for any integration or test.",
    icon: Activity
  },
  {
    title: "Inspect Requests",
    description: "View detailed logs of every incoming webhook request, including headers, body, and status.",
    icon: BarChart2
  },
  {
    title: "Forward to Multiple Destinations",
    description: "Forward incoming webhooks to multiple URLs with custom HTTP methods.",
    icon: Send
  },
  {
    title: "Export Logs",
    description: "Export your request logs as JSON for further analysis or debugging.",
    icon: Download
  },
  {
    title: "Testing Playground",
    description: "Test your endpoints with sample payloads and cURL commands directly from the dashboard.",
    icon: FlaskConical
  },
  {
    title: "Profile & Personalization",
    description: "Manage your user profile and personalize your dashboard experience.",
    icon: UserCircle
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Built for Modern Webhook Workflows</h2>
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