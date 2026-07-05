"use client";

import { useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Bug, Lightbulb, HelpCircle, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { track } from "@/lib/analytics";

export default function ContactUsClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      setError("Choose a category so your message reaches the right place.");
      return;
    }
    setIsSubmitting(true);

    try {
      setError(null);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      track("contact_form_submitted", { category: formData.category });

      setIsSubmitting(false);
      setIsSubmitted(true);

      // Reset form after showing success
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          subject: "",
          category: "",
          message: ""
        });
      }, 5000);
    } catch (error) {
      setIsSubmitting(false);
      setError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <PageLayout showHeader>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-12 pb-12">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Message received</h2>
                <p className="text-muted-foreground mb-4">
                  Thanks for writing. We&apos;ll get back to you within 24&ndash;48 hours.
                </p>
                <p className="text-sm text-muted-foreground">
                  Taking you back to the form&hellip;
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showHeader>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Have a question, suggestion, or need help? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-sm">
                      <a
                        href="mailto:anjumanraj2@gmail.com"
                        className="text-primary underline underline-offset-4"
                      >
                        anjumanraj2@gmail.com
                      </a>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Questions, bugs, and feature requests all land in the
                      same inbox — the form on this page goes there too.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Most messages get a reply within 24&ndash;48 hours. Bug
                    reports that break your debugging get looked at first.
                  </p>
                </CardContent>
              </Card>

            
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <p className="text-muted-foreground">
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </p>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-6 p-4 rounded-md border border-destructive/40 bg-destructive/10 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-destructive">Message not sent</h4>
                        <p className="text-destructive/90 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              General Inquiry
                            </div>
                          </SelectItem>
                          <SelectItem value="bug">
                            <div className="flex items-center gap-2">
                              <Bug className="h-4 w-4" />
                              Bug Report
                            </div>
                          </SelectItem>
                          <SelectItem value="feature">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Feature Request
                            </div>
                          </SelectItem>
                          <SelectItem value="support">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4" />
                              Technical Support
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        placeholder="Brief description of your inquiry"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        placeholder="Please provide details about your inquiry, including any relevant information that might help us assist you better."
                        rows={6}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">How do I create a webhook endpoint?</h4>
                    <p className="text-muted-foreground text-sm">
                      Open the console and create an endpoint — no account
                      needed. Your URL is live immediately and starts catching
                      the moment something calls it.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Is the service really free?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes. Catching, inspecting, forwarding, replay, export,
                      the REST API, and the MCP server are all free. There is
                      no paid tier.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">How long is webhook data stored?</h4>
                    <p className="text-muted-foreground text-sm">
                      Requests are deleted automatically after 30 days. Pin a
                      request and it&apos;s kept until you unpin it.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Can I integrate with my existing tools?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes — forward captures to any URL (including localhost),
                      query them over the REST API, or connect your AI agent
                      through the built-in MCP server.
                    </p>
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
