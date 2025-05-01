"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

interface EndpointListProps {
  ulid: string;
}

interface Endpoint {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  lastActivity: string;
  status: string;
  requestCount: number;
}

// This will be replaced with real data from the API
const MOCK_ENDPOINTS: Endpoint[] = [
  {
    id: "1",
    name: "test-endpoint",
    url: "/webhook/test-endpoint",
    createdAt: "2024-05-02T00:21:11.000Z",
    lastActivity: "2024-05-02T00:21:11.000Z",
    status: "active",
    requestCount: 0,
  },
];

export function EndpointList({ ulid }: EndpointListProps) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  
  useEffect(() => {
    // In the future, this will fetch from the API
    setEndpoints(MOCK_ENDPOINTS);
  }, []);

  const copyEndpointUrl = async (url: string) => {
    const fullUrl = `${window.location.origin}/api/webhook/${ulid}${url}`;
    await navigator.clipboard.writeText(fullUrl);
  };

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No endpoints created yet
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requests</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((endpoint) => (
            <TableRow key={endpoint.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/${ulid}/${endpoint.name}`}
                  className="hover:underline"
                >
                  {endpoint.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={endpoint.status === "active" ? "default" : "secondary"}>
                  {endpoint.status}
                </Badge>
              </TableCell>
              <TableCell>{endpoint.requestCount}</TableCell>
              <TableCell>{formatDate(new Date(endpoint.lastActivity))}</TableCell>
              <TableCell>{formatDate(new Date(endpoint.createdAt))}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyEndpointUrl(endpoint.url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <Link href={`/dashboard/${ulid}/${endpoint.name}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 