import PageLayout from "@/components/page-layout";
import { APP_NAME } from "@/constant/app-constant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Code, Bot, Rocket, Heart, Repeat2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GetStartedBtn from "@/home/get-started-btn";

export const metadata = {
  title: `About Us - ${APP_NAME}`,
  description: `The story behind ${APP_NAME} — a free, anonymous-first webhook debugger that your AI agent can use too.`,
};

export default function AboutUsPage() {
  return (
    <PageLayout showHeader>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About {APP_NAME}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We&apos;re making webhook debugging effortless — whether you write
              the code yourself or build with an AI agent.
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
                  Webhook debugging is usually done blind: a provider says it
                  sent something, your app says nothing arrived, and the truth
                  is somewhere in between. We&apos;ve lived that loop — waiting,
                  redeploying, adding print statements — and built {APP_NAME} to
                  end it.
                </p>
                <p>
                  The idea is simple: give anyone an instant, reliable endpoint
                  that shows every request the moment it lands. No setup, no
                  account, no missed webhooks, no guessing.
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
                      Mint a URL in one click — no account, no config. It&apos;s
                      live before the page finishes loading.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Live Inspection
                    </h4>
                    <p className="text-muted-foreground">
                      Requests stream onto your screen as they arrive: method,
                      headers, query, and a pretty-printed body. Secret headers
                      are redacted before they&apos;re stored.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Repeat2 className="h-4 w-4" />
                      Replay &amp; Forward
                    </h4>
                    <p className="text-muted-foreground">
                      Relay every capture to localhost, or fire any request
                      again — as-is or with an edited body. Thirty days of
                      searchable history; pinned requests never expire.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Built for AI Agents
                    </h4>
                    <p className="text-muted-foreground">
                      A built-in MCP server and a token-scoped REST API let
                      Claude Code, Cursor, or any agent read your captures and
                      debug alongside you.
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
                  {APP_NAME} started as a side project born of frustration with
                  existing webhook tools — too complex, too expensive, or
                  unreliable exactly when we needed them.
                </p>
                <p>
                  We wanted something simple: create a URL, receive webhooks,
                  inspect payloads. That simplicity became our core philosophy,
                  and every feature since has had to earn its place against it.
                </p>
                <p>
                  Today, developers — and a growing number of people building
                  with AI tools — use {APP_NAME} to test integrations with
                  payment providers, CI/CD systems, notification services, and
                  countless other webhook-enabled platforms.
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
                    <div className="w-12 h-12 bg-accent-soft rounded-full flex items-center justify-center mx-auto">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold">Simplicity First</h4>
                    <p className="text-muted-foreground text-sm">
                      Every feature should be intuitive and serve a clear
                      purpose.
                    </p>
                  </div>

                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-accent-soft rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold">Privacy &amp; Security</h4>
                    <p className="text-muted-foreground text-sm">
                      Secret headers never touch the database, analytics never
                      sees payloads, and everything deletes itself after 30
                      days.
                    </p>
                  </div>

                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-accent-soft rounded-full flex items-center justify-center mx-auto">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold">Developer Love</h4>
                    <p className="text-muted-foreground text-sm">
                      Built by a developer who got tired of debugging webhooks
                      blind — and kept every feature free.
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
                  <Badge variant="secondary">Free Forever</Badge>
                  <Badge variant="secondary">Actively Developed</Badge>
                  <Badge variant="secondary">Launched on Product Hunt</Badge>
                </div>
                <p className="text-muted-foreground">
                  Everything in {APP_NAME} is free: catching, inspecting,
                  forwarding, replay, export, the REST API, and the MCP server.
                  There is no paid tier and no card field anywhere. We ship
                  continuously, and the roadmap is driven by what users ask
                  for.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Get Involved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We&apos;re always looking for ways to make {APP_NAME} more
                    useful. Here&apos;s how you can help:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">For Users</h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>• Share feedback and feature requests</li>
                        <li>• Report bugs and rough edges</li>
                        <li>• Tell a teammate who&apos;s fighting a webhook</li>
                        <li>• Leave a review on Product Hunt</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">For AI Builders</h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>• Connect your agent over MCP and tell us what it needs</li>
                        <li>• Build on the token-scoped REST API</li>
                        <li>• Propose provider samples and integrations</li>
                        <li>• Show us what your agent debugged</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button asChild>
                      <Link href="/contact-us">Get in Touch</Link>
                    </Button>
                    <GetStartedBtn cta="about">
                      <Button variant="outline">Open the Console</Button>
                    </GetStartedBtn>
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
