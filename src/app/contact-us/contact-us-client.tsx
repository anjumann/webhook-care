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

      console.log('Contact form sent successfully:', result);
      
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
      }, 3000);
    } catch (error) {
      console.error('Error sending contact form:', error);
      setIsSubmitting(false);
      setError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-12 pb-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-4">
                  Your message has been received. We&apos;ll get back to you within 24-48 hours.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you back to the form...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
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
                    <h4 className="font-semibold">General Inquiries</h4>
                    <p className="text-muted-foreground text-sm">anjumanraj2@gmail.com</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Bug Reports</h4>
                    <p className="text-muted-foreground text-sm">anjumanraj2@gmail.com</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Feature Requests</h4>
                    <p className="text-muted-foreground text-sm">anjumanraj2@gmail.com</p>
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
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">General Support</span>
                    <span className="text-sm text-muted-foreground">24-48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Bug Reports</span>
                    <span className="text-sm text-muted-foreground">12-24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Critical Issues</span>
                    <span className="text-sm text-muted-foreground">2-6 hours</span>
                  </div>
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
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800">Error sending message</h4>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
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
                      <Label htmlFor="category">Category</Label>
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
                      Simply visit our dashboard and click &quot;Create Endpoint&quot;. You&apos;ll get an instant URL to test with.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Is the service really free?</h4>
                    <p className="text-muted-foreground text-sm">
                      Yes! Basic webhook testing is completely free. Premium features like AI analysis are coming soon.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">How long is webhook data stored?</h4>
                    <p className="text-muted-foreground text-sm">
                      Webhook data is automatically deleted after 30 days for privacy and security.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Can I integrate with my existing tools?</h4>
                    <p className="text-muted-foreground text-sm">
                      We&apos;re working on platform integrations as part of our premium features coming soon!
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
