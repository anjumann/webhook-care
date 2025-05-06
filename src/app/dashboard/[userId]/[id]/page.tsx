"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestList } from "@/endpoints/request-list";
import { CopyButton } from "@/components/copy-button";
import { useEffect, useState } from "react";
import { useGetEndpoint } from "@/endpoints/api/endpoints";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import CustomBreadcrumb from "@/components/custom-breadcrumb";

interface EndpointDetailsPageProps {
  params: Promise<{
    userId: string;
    id: string;
  }>;
}

export default function EndpointDetailsPage({ params }: EndpointDetailsPageProps) {
  useEffect(() => {
    const getParams = async () => {
      const { userId, id } = await params;
      setParam({ userId, id });
    }
    getParams();
  }, [params]);

  const [param, setParam] = useState<{
    userId: string;
    id: string;
  } | null>(null);


  const { endpoints, isLoading, mutate } = useGetEndpoint(param?.id ?? '');

  const webhookUrl = `/api/webhook/${param?.userId}/${endpoints?.name}`;
  const [fullWebhookUrl, setFullWebhookUrl] = useState<string>('');

  useEffect(() => {
    // Set the full URL only on the client side
    setFullWebhookUrl(window.location.origin + webhookUrl);
  }, [webhookUrl]);

  // Calculate success rate for the last 24 hours
  const calculateSuccessRate = () => {
    if (!endpoints?.requests?.length) return '100%';
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = endpoints.requests.filter(
      req => new Date(req.createdAt) > last24Hours
    );
    if (!recentRequests.length) return '100%';
    const successfulRequests = recentRequests.filter(req => req.statusCode >= 200 && req.statusCode < 300);
    return `${Math.round((successfulRequests.length / recentRequests.length) * 100)}%`;
  };

  // Calculate average response time for the last 24 hours
  const calculateAvgResponseTime = () => {
    if (!endpoints?.requests?.length) return '0';
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = endpoints.requests.filter(
      req => new Date(req.createdAt) > last24Hours
    );
    if (!recentRequests.length) return '0';
    const avgTime = recentRequests.reduce((acc, req) => acc + req.duration, 0) / recentRequests.length;
    return `${Math.round(avgTime)}`;
  };

  const formatLastActivity = () => {
    if (!endpoints?.lastActivity) return 'Never';
    return formatDistanceToNow(new Date(endpoints.lastActivity), { addSuffix: true });
  };

  const routeList = [
    {
      label: "Webhook Care",
      href: `/`,
    },
    {
      label: "Dashboard",
      href: `/dashboard/${param?.userId}`,
    },
    {
      label: endpoints?.name || param?.id || '',
      href: `/dashboard/${param?.userId}/${param?.id}`,
    },
  ]

  return (
    <main className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isLoading && <Skeleton className="h-9 w-48" />}
          </h1>
          {isLoading && (
            <Skeleton className="h-6 w-64" />
          )}
          {!isLoading && <CustomBreadcrumb header={endpoints?.name || param?.id} description="Monitor and configure your webhook endpoint" routeList={routeList} />}

        </div>
        <CopyButton text={fullWebhookUrl} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{endpoints?.requestCount || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{calculateSuccessRate()}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{calculateAvgResponseTime()}ms</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatLastActivity()}</div>
                <p className="text-xs text-muted-foreground">
                  {endpoints?.lastActivity ? 'Last request received' : 'No requests yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Log</CardTitle>
          <CardDescription>
            Recent webhook requests received by this endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestList mutate={mutate} requests={endpoints?.requests || []} />
        </CardContent>
      </Card>
    </main>
  );
} 