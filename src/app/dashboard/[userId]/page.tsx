import { 
  EnhancedCard as Card,
  EnhancedCardHeader as CardHeader,
  EnhancedCardTitle as CardTitle,
  EnhancedCardDescription as CardDescription,
  EnhancedCardContent as CardContent,
} from "@/components/enhanced-card";
import { EndpointList } from "@/endpoints/endpoint-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createOrGetUser } from "@/dashboard/action";
import CustomBreadcrumb from "@/components/custom-breadcrumb";
import { APP_NAME } from "@/constant/app-constant";

interface DashboardPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { userId } = await params;

  const userResponse = await createOrGetUser({ userId });

  if ('error' in userResponse) {
    return <div>Error: {userResponse.error}</div>;
  }
  const routeList = [
    {
      label: APP_NAME,
      href: `/`,
    },
    {
      label: "Dashboard",
      href: `/dashboard/${userId}`,
    },
  ]

  return (
    <main className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <CustomBreadcrumb routeList={routeList} header="Dashboard" description="Manage your webhook endpoints and view request logs" />
        </div>

        <Button asChild  size="sm" variant="outline" >
          <Link href={`/dashboard/${userId}/endpoint/create`}>
            <Plus className="mr-1 h-4 w-4" />
            Create Endpoint
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userResponse._count?.endpoints}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all endpoints
            </p>
          </CardContent>
        </Card>

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userResponse.endpoints.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently receiving requests
            </p>
          </CardContent>
        </Card>

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
            <p className="text-xs text-muted-foreground">
              To be implemented
            </p>
          </CardContent>
        </Card>

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0ms</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
            <p className="text-xs text-muted-foreground">
              To be implemented
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>
            List of all your webhook endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userId && (
            <EndpointList userId={userId} />
          )}
        </CardContent>
      </Card>
    </main>
  );
} 