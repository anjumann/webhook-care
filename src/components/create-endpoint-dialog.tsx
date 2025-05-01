"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateEndpointDialogProps {
  children: React.ReactNode;
  ulid: string;
}

export function CreateEndpointDialog({ children, ulid }: CreateEndpointDialogProps) {
  const [open, setOpen] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: endpointName,
          ulid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create endpoint");
      }

      const data = await response.json();
      setOpen(false);
      router.push(`/dashboard/${ulid}/${data.name}`);
    } catch (error) {
      console.error("Error creating endpoint:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Endpoint</DialogTitle>
          <DialogDescription>
            Create a new webhook endpoint. You can use this endpoint to receive and inspect webhook requests.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={endpointName}
                onChange={(e) => setEndpointName(e.target.value)}
                className="col-span-3"
                placeholder="my-webhook-endpoint"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create endpoint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 