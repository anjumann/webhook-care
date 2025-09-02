import PageLayout from "@/components/page-layout";
import { APP_NAME } from "@/constant/app-constant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata = {
  title: `Refund Policy - ${APP_NAME}`,
  description: `Refund policy for ${APP_NAME} - Learn about our refund terms and beta testing policies.`,
};

export default function RefundPolicyPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Beta Testing Notice:</strong> Premium features are currently in beta testing. 
              All subscriptions during the beta period are processed through our waitlist system.
            </AlertDescription>
          </Alert>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  At {APP_NAME}, we want you to be completely satisfied with our service. 
                  This refund policy explains the terms and conditions for requesting refunds 
                  on our subscription plans.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beta Testing Period</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>Current Status</h4>
                <ul>
                  <li>Premium features are currently in beta testing phase</li>
                  <li>Subscriptions are processed through a waitlist system</li>
                  <li>Beta users may experience limited functionality or service interruptions</li>
                  <li>Full refunds are available for beta subscribers who are unsatisfied</li>
                </ul>
                
                <h4>Beta Subscriber Rights</h4>
                <ul>
                  <li>100% refund available within 30 days of first payment</li>
                  <li>Prorated refunds for partial usage after 30 days</li>
                  <li>No questions asked for beta-related issues</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>Monthly Plan (₹99/month)</h4>
                <ul>
                  <li>14-day money-back guarantee</li>
                  <li>Refunds processed within 5-7 business days</li>
                  <li>Account access continues until the end of billing cycle</li>
                </ul>
                
                <h4>Annual Plan (₹990/year)</h4>
                <ul>
                  <li>30-day money-back guarantee</li>
                  <li>Prorated refunds available up to 6 months</li>
                  <li>Full refund for service-related issues</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refund Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>Eligible for Full Refund</h4>
                <ul>
                  <li>Service unavailability for more than 48 hours</li>
                  <li>Major feature failures that prevent normal usage</li>
                  <li>Billing errors or duplicate charges</li>
                  <li>Account cancellation within the money-back guarantee period</li>
                  <li>Beta-related functionality issues</li>
                </ul>
                
                <h4>Not Eligible for Refund</h4>
                <ul>
                  <li>Change of mind after guarantee period expires</li>
                  <li>Violation of terms of service leading to account suspension</li>
                  <li>Requesting refund after significant service usage</li>
                  <li>Third-party integration failures outside our control</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refund Process</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <h4>How to Request a Refund</h4>
                <ol>
                  <li>Email us at anjumanraj2@gmail.com with your account details</li>
                  <li>Include your subscription ID and reason for refund</li>
                  <li>Our team will review your request within 2 business days</li>
                  <li>Approved refunds are processed within 5-7 business days</li>
                </ol>
                
                <h4>Required Information</h4>
                <ul>
                  <li>Account email address</li>
                  <li>Subscription/transaction ID</li>
                  <li>Reason for refund request</li>
                  <li>Any relevant screenshots or error messages</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Timeline</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li><strong>Request Review:</strong> 1-2 business days</li>
                  <li><strong>Approval Notification:</strong> Within 24 hours of review</li>
                  <li><strong>Payment Processing:</strong> 3-7 business days</li>
                  <li><strong>Bank Processing:</strong> 2-5 business days (varies by bank)</li>
                </ul>
                <p>
                  Total processing time typically ranges from 5-10 business days from 
                  the initial request.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Partial Refunds</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  For annual subscriptions used beyond the money-back guarantee period:
                </p>
                <ul>
                  <li>Prorated refunds based on unused service time</li>
                  <li>Calculated from the date of refund request</li>
                  <li>Minimum usage charges may apply</li>
                  <li>Service access terminates immediately upon refund processing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Free Tier</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  Our free tier remains available to all users with basic webhook testing features:
                </p>
                <ul>
                  <li>No charges or refund policies apply</li>
                  <li>Service may have usage limitations</li>
                  <li>Community support available</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>For refund requests and questions:</p>
                <ul>
                  <li><strong>Refunds:</strong> anjumanraj2@gmail.com</li>
                  <li><strong>General Support:</strong> anjumanraj2@gmail.com</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Changes</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  We may update this refund policy as our service evolves. Material changes 
                  will be communicated via email and will not affect existing subscriptions 
                  adversely. The &quot;Last updated&quot; date reflects the most recent changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
