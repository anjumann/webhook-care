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
import { Copy, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { deleteEndpoint, useEndpoints } from "./api/endpoints";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

  const router = useRouter();
  const copyEndpointUrl = async (endpointName: string) => {
    const fullUrl = `${window.location.origin}/api/webhook/${userId}/${endpointName}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success("Endpoint URL copied to clipboard");
  };

  const handleDeleteEndpoint = async (endpointId: string) => {
    try {
      await deleteEndpoint(endpointId);
      mutate();
      toast.success("Endpoint deleted");
    } catch (error) {
      console.error("Failed to delete endpoint:", error);
      toast.error("Failed to delete endpoint. Please try again.");
    }
  }
  const { endpoints, isLoading, mutate } = useEndpoints(userId);

  if (!userId) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No endpoints created yet
      </div>
    );
  }

  const headerlist = [
    {
      name: "Name",
      align: "text-center"
    },
    {
      name: "Status",
      align: "text-center"
    },
    {
      name: "Requests",
      align: "text-center"
    },
    {
      name: "Last Activity",
      align: "text-center"
    },
    {
      name: "Created",
      align: "text-center"
    },
    {
      name: "Actions",
      align: "text-center"
    }
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {
              headerlist.map((header, idx) => (
                <TableHead key={idx} className={`${header.align}`}>
                  {header.name}
                </TableHead>
              ))
            }
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
            <TableRow key={endpoint.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/${userId}/${endpoint.id}`)}>
              <TableCell className="text-center font-medium">
                <Link
                  href={`/dashboard/${userId}/${endpoint.id}`}
                  className="hover:underline"
                >
                  {endpoint.name}
                </Link>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={endpoint.status === "active" ? "success" : "destructive"} className="capitalize">
                  {endpoint.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center" >{endpoint.requestCount}</TableCell>
              <TableCell className="text-center" >{formatDate(new Date(endpoint.lastActivity))}</TableCell>
              <TableCell className="text-center" >{formatDate(new Date(endpoint.createdAt))}</TableCell>
              <TableCell className="text-center space-x-2" onClick={(e) => e.stopPropagation()} >
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
                  onClick={() => handleDeleteEndpoint(endpoint.id)}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="cursor-pointer"
                >
                  <Link href={`/dashboard/${userId}/${endpoint.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button> */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 