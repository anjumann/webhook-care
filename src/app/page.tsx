import { Button } from "@/components/ui/button";
import Link from "next/link";
import GetStartedBtn from "@/home/get-started-btn";

export default function Home() {

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-6xl">
            Debug Webhooks with Ease
          </h1>
          <p className="text-xl text-muted-foreground">
            Get instant webhook endpoints for testing and development. No signup required.
            Inspect payloads, customize responses, and debug in real-time.
          </p>
        </div>

        <div className="flex gap-4">
          <GetStartedBtn />
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Documentation
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Instant Endpoints</h3>
            <p className="text-muted-foreground">
              Create webhook endpoints in seconds. No account needed.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Real-time Logs</h3>
            <p className="text-muted-foreground">
              Watch requests come in as they happen. Debug with ease.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Custom Responses</h3>
            <p className="text-muted-foreground">
              Configure how your endpoints respond. Test edge cases.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
