import PageLayout from "@/components/page-layout";
import { APP_NAME } from "@/constant/app-constant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: `Privacy Policy - ${APP_NAME}`,
  description: `Privacy policy for ${APP_NAME} - Learn how we handle your data and protect your privacy.`,
};

export default function PrivacyPolicyPage() {
  return (
    <PageLayout showHeader>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: July 4, 2026
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  Welcome to {APP_NAME}. This Privacy Policy explains how we collect, use, disclose, 
                  and safeguard your information when you use our webhook testing and debugging platform. 
                  Please read this privacy policy carefully.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>Personal Information</h4>
                <ul>
                  <li>Email address and account information</li>
                  <li>Profile information (username, avatar)</li>
                </ul>
                
                <h4>Technical Information</h4>
                <ul>
                  <li>Webhook payloads and request data</li>
                  <li>API usage statistics and logs</li>
                  <li>Browser information and IP addresses</li>
                  <li>Device information and usage patterns</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>We use the collected information for:</p>
                <ul>
                  <li>Providing and maintaining our webhook testing services</li>
                  <li>Improving our platform and developing new features</li>
                  <li>Providing customer support and responding to inquiries</li>
                  <li>Sending important service updates and security notifications</li>
                  <li>Analyzing usage patterns to optimize performance</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Storage and Security</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  We implement appropriate security measures to protect your personal information:
                </p>
                <ul>
                  <li>Webhook data is temporarily stored and automatically deleted after 30 days</li>
                  <li>All data is encrypted in transit using HTTPS/TLS</li>
                  <li>Access to user data is restricted to authorized personnel only</li>
                  <li>Regular security audits and monitoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>We do not sell, trade, or rent your personal information. We may share data only:</p>
                <ul>
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers who assist our operations (under strict confidentiality agreements)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul>
                  <li>Essential cookies for platform functionality</li>
                  <li>Analytics cookies to understand usage patterns</li>
                  <li>Preference cookies to remember your settings</li>
                </ul>
                <h4>Product analytics (PostHog)</h4>
                <p>
                  We use PostHog to measure how the product is used so we can
                  prioritize improvements. PostHog sets cookies/local storage and
                  processes usage events on our behalf. We deliberately limit what
                  is sent:
                </p>
                <ul>
                  <li>
                    <strong>Never your webhook content.</strong> Captured request
                    bodies, headers, and secrets are never sent to analytics —
                    events carry only identifiers, counts, and feature flags.
                  </li>
                  <li>
                    You are pseudonymous by default (an anonymous account id). If
                    you claim your account with a magic link, we attach your{" "}
                    <strong>email</strong> to your analytics profile so we can
                    support you; anonymous visitors have no profile.
                  </li>
                  <li>
                    No session recording and no autocapture — we send only a
                    curated set of product events.
                  </li>
                </ul>
                <p>You can control cookie preferences through your browser settings.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  If you have questions about this Privacy Policy, please contact us:
                </p>
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

            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  We may update this Privacy Policy from time to time. We will notify users of any 
                  material changes via email or through our platform. The &quot;Last updated&quot; date at the 
                  top indicates when this policy was last revised.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
