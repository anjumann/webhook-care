import { BarChart2, List, ClipboardCopy, Eye, RefreshCcw, AlertCircle, UserCircle2, FlaskConical } from "lucide-react";

const features = [
 
  {
    title: "Animated & Responsive UI",
    description: "Enjoy a modern, interactive interface with animated transitions and feedback.",
    icon: Eye
  },
  {
    title: "Real-Time Metrics",
    description: "Monitor request counts, delivery success rates, and response times for each endpoint.",
    icon: BarChart2
  },
  {
    title: "Webhook Playground",
    description: "Interactively test your endpoints with custom payloads, HTTP methods, and headers. Instantly see responses and debug with ease.",
    icon: FlaskConical
  },
  {
    title: "Detailed Request History",
    description: "Access a complete log of all webhook requests, including payloads and responses.",
    icon: List
  },
  {
    title: "Copy-to-Clipboard",
    description: "Quickly copy webhook URLs and cURL commands for easy integration.",
    icon: ClipboardCopy
  },
  {
    title: "Instant Refresh",
    description: "Refresh your data and logs in real-time with a single click.",
    icon: RefreshCcw
  },
  {
    title: "Consistent Error Handling",
    description: "Get clear feedback and error messages for all actions and API calls.",
    icon: AlertCircle
  },
  {
    title: "User Personalization",
    description: "Update your profile and personalize your dashboard experience.",
    icon: UserCircle2
  }
];

export function FeaturesGrid() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">
          Developer Experience at the Core
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 