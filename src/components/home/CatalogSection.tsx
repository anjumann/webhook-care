import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Eye, Send } from "lucide-react";

export function CatalogSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Get Started in 3 Easy Steps</h2>
            <ol className="space-y-6 mb-8">
              <li className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary mt-1" />
                <span>
                  <strong>Create an Endpoint:</strong> Instantly generate a unique webhook endpoint for your integration or test.
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Send className="w-6 h-6 text-primary mt-1" />
                <span>
                  <strong>Send a Webhook:</strong> Use the provided URL and sample cURL command to send a webhook from any service.
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Eye className="w-6 h-6 text-primary mt-1" />
                <span>
                  <strong>Inspect & Forward:</strong> View the full request details in your dashboard and forward to any destination.
                </span>
              </li>
            </ol>
            <Button variant="link" className="group" size="sm">
              Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="bg-muted rounded-lg flex items-center justify-center text-4xl text-muted-foreground font-bold">
            🚀
          </div>
        </div>
      </div>
    </section>
  );
} 