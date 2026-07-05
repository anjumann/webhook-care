import Link from "next/link";
import PageLayout from "@/components/page-layout";
import { APP_NAME } from "@/constant/app-constant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, CalendarClock, Mail } from "lucide-react";

export const metadata = {
  title: `Refund Policy - ${APP_NAME}`,
  description: `Refund policy for ${APP_NAME} - The service is completely free, so there is nothing to refund.`,
};

export default function RefundPolicyPage() {
  return (
    <PageLayout showHeader>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: July 4, 2026
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  The short version
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  {APP_NAME} is completely free right now. We don&apos;t charge you,
                  so there is nothing to refund. No card details are ever collected.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  If we ever introduce paid plans
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li>
                    Any future paid plan will come with a 14-day, no-questions-asked
                    money-back guarantee.
                  </li>
                  <li>
                    This page and the{" "}
                    <Link href="/terms-and-conditions">terms</Link> will be updated
                    before any billing starts.
                  </li>
                  <li>Existing free features stay free.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Questions?
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  If anything here is unclear, email us at{" "}
                  <a
                    href="mailto:anjumanraj2@gmail.com"
                    className="text-primary underline underline-offset-4"
                  >
                    anjumanraj2@gmail.com
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
