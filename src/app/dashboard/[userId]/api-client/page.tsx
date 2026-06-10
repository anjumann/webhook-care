import CustomBreadcrumb from "@/components/custom-breadcrumb";
import { ApiClient } from "@/components/console/api-client";

interface ApiClientPageProps {
  params: Promise<{ userId: string }>;
}

export default async function ApiClientPage({ params }: ApiClientPageProps) {
  const { userId } = await params;

  const routeList = [
    { label: "Webhook Care", href: `/` },
    { label: "Dashboard", href: `/dashboard/${userId}` },
    { label: "API Client", href: `/dashboard/${userId}/api-client` },
  ];

  return (
    <div className="mx-auto max-w-[1180px] py-6">
      <CustomBreadcrumb
        header="API Client"
        description="Make quick API calls without leaving Webhook Care — pick a method, enter any URL, add headers and a body, and inspect the full response."
        routeList={routeList}
      />
      <div className="mt-8">
        <ApiClient userId={userId} />
      </div>
    </div>
  );
}
