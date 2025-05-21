"use client"

import {
  EnhancedCard as Card,
  EnhancedCardHeader as CardHeader,
  EnhancedCardTitle as CardTitle,
  EnhancedCardDescription as CardDescription,
  EnhancedCardContent as CardContent,
} from "@/components/enhanced-card";
import { RequestList } from "@/endpoints/request-list";
import { CopyButton } from "@/components/copy-button";
import { useEffect, useState } from "react";
import { useGetEndpoint } from "@/endpoints/api/endpoints";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import CustomBreadcrumb from "@/components/custom-breadcrumb";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpIcon, ArrowDownIcon, ActivityIcon, CheckCircleIcon, AlertCircleIcon, DownloadIcon, RefreshCcw, LoaderCircle, Eye, EyeOff, PencilIcon } from "lucide-react";
import WebhookTestSection from "@/endpoints/webhook-test-section";
import { AnimatedIconSwitch } from "@/framer-presets/animate-icon-switch";
import { AnimatedShow } from "@/components/ui/animated-show";
import { useRouter, useSearchParams } from "next/navigation";

interface EndpointDetailsPageProps {
  params: Promise<{
    userId: string;
    id: string;
  }>;
}

export default function EndpointDetailsPage({ params }: EndpointDetailsPageProps) {

  const searchParams = useSearchParams();
  const isNew = searchParams?.get('isNew') === 'true' || false;
  const router = useRouter();
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
  const [sectionVisibility, setSectionVisibility] = useState({
    Integration: isNew,
    forwardingURLs: true,
  });

  const webhookUrl = `/api/webhook/${param?.userId}/${endpoints?.name}`;
  const [fullWebhookUrl, setFullWebhookUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
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
  const samplePayload = {
    type: "user.created",
    data: {
      id: "usr_123456789",
      email: "john.doe@example.com",
      name: "John Doe",
      created_at: "2024-01-20T08:30:00Z",
      metadata: {
        source: "web_signup",
        plan: "starter"
      }
    }
  }

  const curlCommand = `curl -X POST ${fullWebhookUrl} -H "Content-Type: application/json" -d '${JSON.stringify(samplePayload)}'`;


  const handleExport = () => {
    if (!endpoints?.requests) return;

    // Prepare the data for export
    const exportData = endpoints.requests.map(request => ({
      id: request.id,
      method: request.method,
      statusCode: request.statusCode,
      duration: request.duration,
      createdAt: request.createdAt,
      headers: request.headers,
      body: request.body,
      response: request.response,
      query: request.query
    }));

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-requests-${endpoints.name || param?.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const toggleSection = (name: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <main className="container py-6 space-y-6 hide-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-6 w-64" />
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <CustomBreadcrumb
                  header={endpoints?.name || param?.id}
                  description="Monitor and manage your webhook endpoint"
                  routeList={routeList}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => toast("Coming soon", {
                    icon: "🚧",
                  })}>
                    <BookOpenIcon className="w-4 h-4 mr-2" />
                    View Docs
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Read integration documentation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}

            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => toast("Coming soon", {
                    icon: "🚧",
                  })}>
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Manage webhook settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="cursor-pointer" size="icon" onClick={() => router.push(`/dashboard/${param?.userId}/${param?.id}/edit`)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Edit Endpoint
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CopyButton text={fullWebhookUrl} label="Copy Webhook URL" variant="outline" isIcon={true} />
                </TooltipTrigger>
                <TooltipContent>
                  Copy Webhook URL
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline"  className="cursor-pointer" size="default" onClick={() => setIsTesting(!isTesting)}>
                    <AnimatedIconSwitch
                      show={isTesting}
                      iconA={<LoaderCircle className="h-4 w-4" />}
                      iconB={<CheckCircleIcon className="h-4 w-4" />}
                    />
                    Testing Playground
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Test the Webhook
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {
          isTesting && (
            <WebhookTestSection initialPayload={JSON.stringify(samplePayload)} url={fullWebhookUrl} isTesting={isTesting} />
          )
        }

        {/* Integration Section */}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start gap-2">
                <CardTitle>
                  <ActivityIcon className="w-5 h-5 text-primary" />
                  Integration Details
                </CardTitle>
                <CardDescription>
                  Use these credentials to send webhook events to your endpoint
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => toggleSection("Integration")} >
                <AnimatedIconSwitch
                  show= {!sectionVisibility.Integration}
                  iconA={<EyeOff />}
                  iconB={<Eye />}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatedShow show={sectionVisibility.Integration}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Webhook URL
                    <span className="text-xs text-muted-foreground">(Required)</span>
                  </label>
                  <div className="flex items-center gap-2 group">
                    <code className="flex-1 p-2 bg-muted/50 rounded-md text-sm font-mono border border-muted-foreground group-hover:bg-muted transition-colors">{fullWebhookUrl}</code>
                    <CopyButton text={fullWebhookUrl} variant="outline" isIcon={true} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Sample cURL
                    <span className="text-xs text-muted-foreground">(Example)</span>
                  </label>
                  <div className="flex items-center gap-2 group">
                    <code className="flex-1 p-2 bg-muted/50 rounded-md text-sm font-mono border border-muted-foreground overflow-x-auto group-hover:bg-muted transition-colors">{curlCommand}</code>
                    <CopyButton text={curlCommand} label="Copy cURL" variant="outline" isIcon={true} />
                  </div>
                </div>
              </div>
            </AnimatedShow>
          </CardContent>
        </Card>

        {/* Forwarding URLs Section */}
        {endpoints?.forwardingUrls && endpoints.forwardingUrls.length > 0 && (

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-start gap-2">
                  <CardTitle>
                    <ActivityIcon className="w-5 h-5 text-primary" />
                    Forwarding URLs
                  </CardTitle>
                  <CardDescription>
                    Requests to this endpoint will be forwarded to the following URLs
                  </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={() => toggleSection("forwardingURLs")} >
                  <AnimatedIconSwitch
                    show={!sectionVisibility.forwardingURLs}
                    iconA={<EyeOff />}
                    iconB={<Eye />}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatedShow show={sectionVisibility.forwardingURLs}>
                <div className="space-y-2">
                  {endpoints.forwardingUrls.map((fw) => (
                    <div key={fw.id} className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-muted text-xs font-mono border border-muted-foreground">
                        {fw.method}
                      </span>
                      <code className="flex-1 p-2 bg-muted/50 rounded-md text-sm font-mono border border-muted-foreground">{fw.url}</code>
                      <CopyButton text={fw.url} variant="outline" />
                    </div>
                  ))}
                </div>
              </AnimatedShow>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Requests</CardTitle>
            <ActivityIcon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{endpoints?.requestCount || 0}</div>
                <p className="text-xs text-muted-foreground">Total requests processed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Success Rate</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{calculateSuccessRate()}</span>
                  <span className="text-sm text-green-600 dark:text-green-500">
                    <ArrowUpIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{calculateAvgResponseTime()}ms</span>
                  <span className="text-sm text-green-600 dark:text-green-500">
                    <ArrowDownIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Webhook Activity</CardTitle>
            <ActivityIcon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatLastActivity()}</div>
                <p className="text-xs text-muted-foreground">
                  {endpoints?.lastActivity ? 'Most recent request received' : 'No requests yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      {/* will implement in the future */}
      {/* <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Success Rate Trend</CardTitle>
            <CardDescription>
              Webhook delivery success rate over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : (
              <LineChart
                data={endpoints?.requests || []}
                dataKey="statusCode"
                valueFormatter={(value) => `${value}%`}
                showGridLines={false}
                className="h-[200px]"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Time Trend</CardTitle>
            <CardDescription>
              Average response time variations over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : (
              <LineChart
                data={endpoints?.requests || []}
                dataKey="duration"
                valueFormatter={(value) => `${value}ms`}
                showGridLines={false}
                className="h-[200px]"
              />
            )}
          </CardContent>
        </Card>
      </div> */}

      {/* Request Log Section */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                <ActivityIcon className="w-5 h-5 text-primary" />
                Request History
              </CardTitle>
              <CardDescription>
                Detailed log of recent webhook requests and their outcomes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <DownloadIcon className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {endpoints?.requests?.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No requests yet</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Send your first webhook request to see the activity here. Use the integration details above to get started.
              </p>
              <Button className="mt-6" variant="outline" size="sm">
                View Integration Guide
              </Button>
            </div>
          ) : (
            <RequestList mutate={mutate} requests={endpoints?.requests || []} />
          )}
        </CardContent>
      </Card>
    </main>
  );
} 