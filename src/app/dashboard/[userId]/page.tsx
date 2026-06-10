import Link from "next/link";
import { Plus } from "lucide-react";
import { EndpointList } from "@/endpoints/endpoint-list";
import { ExportDialog } from "@/endpoints/export-dialog";
import { createOrGetUser } from "@/dashboard/action";
import { EnvPill } from "@/components/console/env-pill";

interface DashboardPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { userId } = await params;

  const userResponse = await createOrGetUser({ userId });

  if ("error" in userResponse) {
    return (
      <div className="rounded-lg border border-danger-soft bg-danger-soft/40 px-4 py-3 text-sm text-danger">
        Error: {userResponse.error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* Page head */}
      <div className="mb-[22px] flex items-start gap-4">
        <div>
          <h1 className="whitespace-nowrap text-[25px] font-bold tracking-[-0.5px]">
            Endpoints
          </h1>
          <p className="mt-[3px] text-[13.5px] text-mid">
            Capture, inspect and forward webhooks across your integrations.
          </p>
          <EnvPill label="Local workspace" className="mt-[9px]" />
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          <ExportDialog userId={userId} multiSelect triggerLabel="Export" />
          <Link
            href={`/dashboard/${userId}/endpoint/create`}
            className="inline-flex h-[34px] items-center gap-[7px] rounded-sm bg-gradient-to-br from-primary to-accent2 px-3.5 text-[13px] font-semibold text-accentfg shadow-[0_5px_16px_var(--accent-soft)] transition-shadow hover:shadow-[0_6px_20px_var(--accent-line)]"
          >
            <Plus className="size-4" strokeWidth={2} />
            Create endpoint
          </Link>
        </div>
      </div>

      <EndpointList userId={userId} />
    </div>
  );
}
