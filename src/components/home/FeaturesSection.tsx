import { Activity, Send, BarChart2, Download, FlaskConical, UserCircle } from "lucide-react";
import { 
  EnhancedCard as Card,
  EnhancedCardHeader as CardHeader,
  EnhancedCardTitle as CardTitle,
  EnhancedCardContent as CardContent,
} from "@/components/enhanced-card";
import { Highlight } from "@/components/ui/Highlight";

const features = [
  {
    title: "Create Webhook Endpoints",
    description: <>Get <Highlight>Temporary Endpoints in Seconds</Highlight>: Stop waiting. Instantly generate unique webhook URLs for any integration, test, or debugging session.</>,
    icon: Activity
  },
  {
    title: "Inspect Requests",
    description: <><Highlight>See Every Detail, Instantly</Highlight>: No more guesswork. Inspect full headers, bodies (pretty-printed!), and status for every request in real-time.</>,
    icon: BarChart2
  },
  {
    title: "Forward to Your Localhost",
    description: <><Highlight>Bridge to Your Localhost & Beyond</Highlight>: Securely forward webhooks to your local dev environment or any other URL, with custom methods and transformation options.</>,
    icon: Send
  },
  {
    title: "Export Logs",
    description: <><Highlight>Keep Your Data, Your Way</Highlight>: Export request logs to JSON for deeper analysis, record-keeping, or sharing with your team.</>,
    icon: Download
  },
  {
    title: "Testing Playground",
    description: <><Highlight>Test & Iterate, Faster</Highlight>: Send sample payloads, generate cURL commands, and simulate various scenarios directly from your dashboard. No external tools needed.</>,
    icon: FlaskConical
  },
  {
    title: "Your Personalized Hub",
    description: <><Highlight>Your Personalized Webhook Hub</Highlight>: Manage your endpoints and preferences in a dashboard tailored to your workflow.</>,
    icon: UserCircle
  }
];

export function FeaturesSection() {
  return (
    <section 
      className="py-24 bg-muted/50"
    >
      <div className="container mx-auto px-4">
        <h2 
          className="text-3xl font-bold text-center mb-16"
        >
          Take Control of Your Webhooks
        </h2>
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <div key={index}>
              <Card variant="feature" className="border-none bg-background h-full">
                <CardHeader>
                  <feature.icon className="w-12 h-12 mb-4 text-green-500" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 