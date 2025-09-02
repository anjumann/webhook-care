import PageLayout from "@/components/page-layout";
import { APP_NAME } from "@/constant/app-constant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Code, Users, Rocket, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: `About Us - ${APP_NAME}`,
  description: `Learn about ${APP_NAME} - Our mission to simplify webhook testing and debugging for developers worldwide.`,
};

export default function AboutUsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About {APP_NAME}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We&apos;re on a mission to make webhook testing and debugging effortless for developers worldwide.
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  At {APP_NAME}, we believe that webhook development shouldn&apos;t be a painful experience. 
                  We&apos;ve experienced firsthand the frustration of debugging webhook integrations, 
                  inspecting payloads, and testing webhook endpoints.
                </p>
                <p>
                  Our platform was born out of necessity - to provide developers with instant, 
                  reliable webhook endpoints that make testing and debugging a breeze. No more 
                  complex setup, no more missed webhooks, no more debugging headaches.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  What We Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Instant Endpoints
                    </h4>
                    <p className="text-muted-foreground">
                      Create webhook endpoints in seconds. No registration required for basic testing.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Real-time Inspection
                    </h4>
                    <p className="text-muted-foreground">
                      View webhook payloads in real-time with beautiful formatting and filtering.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Collaboration
                    </h4>
                    <p className="text-muted-foreground">
                      Share webhook endpoints with your team and collaborate on debugging.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      AI-Powered Analysis
                    </h4>
                    <p className="text-muted-foreground">
                      Get intelligent insights and suggestions with our AI-based payload analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Story</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  {APP_NAME} started as a side project when we were frustrated with existing webhook 
                  testing solutions. Too many were either too complex, too expensive, or simply didn&apos;t 
                  work reliably when we needed them most.
                </p>
                <p>
                  We wanted something simple: create a URL, receive webhooks, inspect payloads. 
                  That simplicity became our core philosophy, and we&apos;ve built every feature 
                  with that principle in mind.
                </p>
                <p>
                  Today, developers around the world use {APP_NAME} to test integrations with 
                  payment providers, CI/CD systems, notification services, and countless other 
                  webhook-enabled platforms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold">Simplicity First</h4>
                    <p className="text-muted-foreground text-sm">
                      Every feature should be intuitive and serve a clear purpose.
                    </p>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold">Privacy & Security</h4>
                    <p className="text-muted-foreground text-sm">
                      Your data is yours. We protect it and delete it automatically.
                    </p>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold">Developer Love</h4>
                    <p className="text-muted-foreground text-sm">
                      Built by developers, for developers, with love and attention to detail.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* <Badge variant="secondary">Open Source</Badge> */}
                  <Badge variant="secondary">Beta Testing</Badge>
                  <Badge variant="secondary">Actively Developed</Badge>
                  <Badge variant="secondary">Community Driven</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  We&apos;re currently in beta testing for our premium features, including AI-based 
                  analysis and advanced platform integrations. Our core webhook testing features 
                  remain free and always will be.
                </p>
                {/* <p className="text-muted-foreground">
                  {APP_NAME} is open source and community-driven. We welcome contributions, 
                  feedback, and feature requests from developers worldwide.
                </p> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Get Involved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We&apos;re always looking for ways to improve {APP_NAME} and serve the developer 
                    community better. Here&apos;s how you can get involved:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">For Users</h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>• Share feedback and feature requests</li>
                        <li>• Report bugs and issues</li>
                        <li>• Spread the word to other developers</li>
                        <li>• Join our beta testing program</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">For Developers</h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>• Contribute to our open source codebase</li>
                        <li>• Help with documentation and guides</li>
                        <li>• Propose new integrations</li>
                        <li>• Join our community discussions</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <Button asChild>
                      <Link href="/contact-us">Get in Touch</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
