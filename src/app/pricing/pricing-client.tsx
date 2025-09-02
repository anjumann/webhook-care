"use client";

import { useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Zap, Brain, Link, Users, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PricingClient() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubscribe = (planType: string) => {
    setSelectedPlan(planType);
    setShowWaitlistModal(true);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Console log as requested
    console.log(`Waitlist signup - Plan: ${selectedPlan}, Email: ${email}`);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setShowWaitlistModal(false);
        setEmail("");
        setSelectedPlan("");
      }, 2000);
    }, 1000);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start for free, upgrade when you need advanced features. No hidden fees, cancel anytime.
            </p>
          </div>

          <Alert className="mb-8 max-w-3xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Beta Testing:</strong> Premium features are currently in development. 
              Join our waitlist to be notified when they become available!
            </AlertDescription>
          </Alert>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Free</span>
                  <Badge variant="secondary">Current</Badge>
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₹0</span>
                  <span className="text-muted-foreground ml-1">/forever</span>
                </div>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Unlimited webhook endpoints</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time payload inspection</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">30-day data retention</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Basic request filtering</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Community support</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" disabled>
                  Already Free
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="relative border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pro Monthly</span>
                  <Badge>Popular</Badge>
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₹99</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>
                <p className="text-muted-foreground">For growing projects</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Everything in Free, plus:</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">AI-based payload analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Link className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Platform integrations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Team collaboration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Extended data retention</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe("Monthly")}
                >
                  Join Waitlist
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pro Yearly</span>
                  <Badge variant="secondary">Best Value</Badge>
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₹990</span>
                  <span className="text-muted-foreground ml-1">/year</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground line-through">₹1,188</span>
                  <Badge variant="outline" className="text-xs">Save ₹198</Badge>
                </div>
                <p className="text-muted-foreground">
                  <span className="text-sm">₹82.5/month • 2 months free</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Everything in Pro Monthly, plus:</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">AI-based payload analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Link className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Platform integrations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Team collaboration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Extended data retention</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleSubscribe("Yearly")}
                >
                  Join Waitlist
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Features</th>
                        <th className="text-center p-4 font-semibold">Free</th>
                        <th className="text-center p-4 font-semibold">Pro</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-4">Webhook Endpoints</td>
                        <td className="text-center p-4">Unlimited</td>
                        <td className="text-center p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">Real-time Inspection</td>
                        <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">Data Retention</td>
                        <td className="text-center p-4">30 days</td>
                        <td className="text-center p-4">90 days</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">AI Payload Analysis</td>
                        <td className="text-center p-4">-</td>
                        <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">Platform Integrations</td>
                        <td className="text-center p-4">-</td>
                        <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4">Team Collaboration</td>
                        <td className="text-center p-4">-</td>
                        <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="p-4">Support</td>
                        <td className="text-center p-4">Community</td>
                        <td className="text-center p-4">Priority</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="space-y-3">
                <h4 className="font-semibold">When will premium features be available?</h4>
                <p className="text-muted-foreground text-sm">
                  We&apos;re currently in beta testing. Waitlist members will be the first to know when premium features launch.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Can I cancel anytime?</h4>
                <p className="text-muted-foreground text-sm">
                  Yes! You can cancel your subscription at any time. Your access continues until the end of your billing period.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">What payment methods do you accept?</h4>
                <p className="text-muted-foreground text-sm">
                  We&apos;ll support major credit/debit cards and UPI payments when billing goes live.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Is there a free trial for pro features?</h4>
                <p className="text-muted-foreground text-sm">
                  Beta testers will get complimentary access to test premium features before official launch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join the Beta Waitlist</DialogTitle>
            <DialogDescription>
              {selectedPlan} plan is coming soon! Enter your email to be notified when it&apos;s available.
            </DialogDescription>
          </DialogHeader>
          
          {isSubmitted ? (
            <div className="text-center py-6">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">You&apos;re on the list!</h3>
              <p className="text-muted-foreground text-sm">
                We&apos;ll notify you when {selectedPlan.toLowerCase()} plan is ready.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWaitlistModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Adding..." : "Join Waitlist"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
