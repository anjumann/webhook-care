import Link from "next/link";
import PageLayout from "@/components/page-layout";
import { APP_NAME } from "@/constant/app-constant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: `Terms and Conditions - ${APP_NAME}`,
  description: `Terms and conditions for ${APP_NAME} - Learn about our service terms and user responsibilities.`,
};

export default function TermsAndConditionsPage() {
  return (
    <PageLayout showHeader>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: July 4, 2026
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Agreement to Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  By accessing and using {APP_NAME}, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Description</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  {APP_NAME} provides a webhook testing and debugging platform that allows users to:
                </p>
                <ul>
                  <li>Create temporary and permanent webhook endpoints</li>
                  <li>Inspect and analyze webhook payloads</li>
                  <li>Forward webhooks to multiple destinations</li>
                  <li>Query captures over a token-scoped REST API and a built-in MCP server (for AI agents and tools)</li>
                  <li>Export request history (JSON/CSV/ZIP)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Accounts and Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>Account Creation</h4>
                <ul>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>One account per person or organization</li>
                  <li>You must be at least 18 years old or have parental consent</li>
                </ul>
                
                <h4>Prohibited Uses</h4>
                <ul>
                  <li>Illegal activities or violating any applicable laws</li>
                  <li>Transmitting malicious code or harmful content</li>
                  <li>Attempting to gain unauthorized access to our systems</li>
                  <li>Excessive use that may impact service performance</li>
                  <li>Sharing account credentials with unauthorized parties</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Free Service</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  {APP_NAME} is currently free. Every feature — catching, inspecting, and
                  forwarding webhooks, replay, the REST API, and the MCP server — is available
                  at no cost. We do not collect any billing details.
                </p>
                <p>
                  Free comes with a fair-use expectation: rate limits may apply to abusive or
                  excessive traffic to keep the service reliable for everyone.
                </p>
                <p>
                  If we ever introduce paid plans, these terms and the{" "}
                  <Link href="/refund-policy">refund policy</Link> will be updated first, and
                  no one will be charged silently.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data and Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li>Webhook data is stored temporarily and automatically deleted after 30 days</li>
                  <li>We do not access or monitor webhook content except for system maintenance</li>
                  <li>Users are responsible for the content of webhooks they receive</li>
                  <li>Sensitive data should not be transmitted through our platform</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Availability</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li>We strive for 99.9% uptime but do not guarantee uninterrupted service</li>
                  <li>Scheduled maintenance will be announced in advance when possible</li>
                  <li>We reserve the right to modify or discontinue features with notice</li>
                  <li>Service levels may vary during beta testing periods</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li>All platform content and features are owned by {APP_NAME}</li>
                  <li>Users retain rights to their webhook data and content</li>
                  <li>Our logo, trademarks, and branding are protected intellectual property</li>
                  <li>Users may not reverse engineer or copy our platform functionality</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  {APP_NAME} shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, including without limitation, loss of profits, 
                  data, use, goodwill, or other intangible losses, resulting from your use of the service.
                </p>
                <p>
                  Our total liability shall not exceed the amount paid by you for the service 
                  in the 12 months preceding the claim.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termination</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li>Either party may terminate the agreement at any time</li>
                  <li>We may suspend accounts for violations of these terms</li>
                  <li>Upon termination, your data will be deleted according to our retention policy</li>
                  <li>Refunds will be processed according to our <Link href="/refund-policy">refund policy</Link></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  We reserve the right to modify these terms at any time. Material changes will be 
                  communicated via email or platform notifications. Continued use of the service 
                  after changes constitutes acceptance of the new terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>For questions about these Terms and Conditions:</p>
                <ul>
                  <li>
                    Email:{" "}
                    <a
                      href="mailto:anjumanraj2@gmail.com"
                      className="text-primary underline underline-offset-4"
                    >
                      anjumanraj2@gmail.com
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
