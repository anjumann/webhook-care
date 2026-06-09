import { Button } from "@/components/ui/button";
import GetStartedBtn from "@/home/get-started-btn";
import { ArrowRight, Zap, Eye, Send } from "lucide-react";
import { Highlight } from "@/components/ui/Highlight";

export function CatalogSection() {
  return (
    <section
      className="py-24 px-2"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Start catching in <br className="md:hidden" /> <Highlight>3 Easy Steps</Highlight></h2>
            <ol 
              className="space-y-6 mb-8"
            >
              <li className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-green-500 mt-1" />
                <span>
                  <strong>1. Create Your Endpoint:</strong> Instantly generate a <Highlight>unique URL</Highlight> for your integration or test.
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Send className="w-6 h-6 text-green-500 mt-1" />
                <span>
                  <strong>2. Send a Test Webhook:</strong> Use our provided URL in your service, or fire off a quick test with the <Highlight>sample cURL command</Highlight>.
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Eye className="w-6 h-6 text-green-500 mt-1" />
                <span>
                  <strong>3. Inspect, Customize & Forward:</strong> Dive into <Highlight>request details</Highlight> on your dashboard. Customize responses, forward to local, and more.
                </span>
              </li>
            </ol>
            <GetStartedBtn>
              <Button variant="link" className="group" size="sm">
                Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </GetStartedBtn>
          </div>
        </div>
      </div>
    </section>
  );
}