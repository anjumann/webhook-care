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
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";

interface RequestListProps {
  endpointId: string;
}

interface Request {
  id: string;
  method: string;
  statusCode: number;
  duration: number;
  createdAt: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

// This will be replaced with real data from the API
const MOCK_REQUESTS: Request[] = [
  {
    id: "1",
    method: "POST",
    statusCode: 200,
    duration: 150,
    createdAt: "2024-05-02T00:21:11.000Z",
    headers: {
      "content-type": "application/json",
      "user-agent": "curl/7.64.1",
    },
    body: {
      event: "user.created",
      data: {
        id: 123,
        name: "John Doe",
      },
    },
  },
];

export function RequestList({ endpointId }: RequestListProps) {
  console.log("endpointId", endpointId);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    // In the future, this will fetch from the API
    setRequests(MOCK_REQUESTS);
  }, []);

  const toggleRequest = (id: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRequests(newExpanded);
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No requests received yet
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => [
            <TableRow 
              key={`${request.id}-row`}
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => toggleRequest(request.id)}
            >
              <TableCell>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  {expandedRequests.has(request.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{request.method}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={request.statusCode < 400 ? "default" : "destructive"}
                >
                  {request.statusCode}
                </Badge>
              </TableCell>
              <TableCell>{request.duration}ms</TableCell>
              <TableCell>{formatDate(new Date(request.createdAt))}</TableCell>
            </TableRow>,
            expandedRequests.has(request.id) && (
              <TableRow key={`${request.id}-expanded`}>
                <TableCell colSpan={5}>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Headers</h4>
                      <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(request.headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Body</h4>
                      <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(request.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )
          ].filter(Boolean))}
        </TableBody>
      </Table>
    </div>
  );
} 