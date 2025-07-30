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
import { ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { deleteRequest } from "./api/endpoints";
import toast from "react-hot-toast";
import { METHODS } from "@/constant/app-constant";
import { ScrollArea } from "@/components/ui/scroll-area";
import { unwantedHeaders } from "@/constant";

interface RequestListProps {
  requests: Request[];
  mutate: () => void;
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

// JSON Display Component
function JsonDisplay({ data, title, onCopy }: { data: any; title: string; onCopy: () => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const jsonString = JSON.stringify(data, null, 2);
  const isLong = jsonString.length > 500;
  const displayText = isExpanded ? jsonString : jsonString.slice(0, 500) + (isLong ? '...' : '');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="flex gap-2">
          {isLong && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onCopy} className="text-xs">
            Copy <Copy className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50">
        <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words">
          {displayText}
        </pre>
      </ScrollArea>
    </div>
  );
}

// Function to filter out unwanted headers
const filterHeaders = (headers: Record<string, string>): Record<string, string> => {


  const filteredHeaders: Record<string, string> = {};
  
  Object.entries(headers).forEach(([key, value]) => {
    if (!unwantedHeaders.includes(key.toLowerCase())) {
      filteredHeaders[key] = value;
    }
  });

  return filteredHeaders;
};

export function RequestList({ requests, mutate }: RequestListProps) {
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());


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
            <TableHead>Actions</TableHead>
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
                <Badge variant="outline" >{ METHODS[request.method as keyof typeof METHODS].label}</Badge>
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
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(JSON.stringify(request.body, null, 2));
                      toast.success("Payload copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteRequest(request.id);
                      mutate();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>,
            expandedRequests.has(request.id) && (
              <TableRow key={`${request.id}-expanded`}>
                <TableCell colSpan={6} className="p-0">
                  <div className="p-4 space-y-4">
                    <JsonDisplay
                      data={filterHeaders(request.headers)}
                      title="Headers"
                      onCopy={() => {
                        const filteredHeaders = filterHeaders(request.headers);
                        navigator.clipboard.writeText(JSON.stringify(filteredHeaders, null, 2));
                        toast.success("Headers copied to clipboard");
                      }}
                    />
                    <JsonDisplay
                      data={request.body}
                      title="Body"
                      onCopy={() => {
                        navigator.clipboard.writeText(JSON.stringify(request.body, null, 2));
                        toast.success("Body copied to clipboard");
                      }}
                    />
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