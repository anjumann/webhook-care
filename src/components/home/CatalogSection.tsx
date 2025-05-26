import { Button } from "@/components/ui/button";
import GetStartedBtn from "@/home/get-started-btn";
import { ArrowRight, Zap, Eye, Send } from "lucide-react";
import Image from "next/image";
import { Highlight } from "@/components/ui/Highlight";

export function CatalogSection() {
  return (
    <section 
      className="py-24"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Get Started in <Highlight>3 Easy Steps</Highlight></h2>
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
          <div 
            className="bg-muted rounded-lg flex items-center justify-center text-4xl text-muted-foreground font-bold"
          >
            <Image
              src="/home/details-page.png"
              alt="Dashboard Preview"
              width={600}
              height={400}
              className="rounded-lg w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 