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
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { deleteEndpoint, useEndpoints } from "./api/endpoints";

export interface Endpoint {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  requestCount: number;
  userId: string;
}


interface EndpointListProps {
  userId: string;
  endpoints?: Endpoint[] | null;
}


export function EndpointList({ userId }: EndpointListProps) {

  const copyEndpointUrl = async (endpointName: string) => {
    const fullUrl = `${window.location.origin}/api/webhook/${userId}/${endpointName}`;
    await navigator.clipboard.writeText(fullUrl);
  };

  const { endpoints, isLoading, mutate } = useEndpoints(userId);

  if (!userId) {
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
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : endpoints?.map((endpoint) => (
            <TableRow key={endpoint.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/${userId}/${endpoint.id}`}
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
              <TableCell className="text-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyEndpointUrl(endpoint.name)}
                  className="cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await deleteEndpoint(endpoint.id);
                    mutate();
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="cursor-pointer"
                >
                  <Link href={`/dashboard/${userId}/${endpoint.id}`}>
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