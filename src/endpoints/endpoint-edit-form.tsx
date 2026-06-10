"use client"

import React, { useEffect, useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import CustomBreadcrumb from '@/components/custom-breadcrumb'
import { AlertCircle, ChevronDown, Forward, Plus, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getEndpoint } from './api/endpoints'
import { useSession } from '@/components/auth/session-provider'
import { Panel, PanelHead } from '@/components/console/panel'

export default function EndpointEditForm({ id }: { id?: string }) {

    const router = useRouter();
    const user = useUser();
    const { ready } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [origin, setOrigin] = useState("");
    // Forwarding is optional — collapsed by default so the primary actions stay
    // above the fold. Auto-expands when an endpoint loads with existing rules.
    const [fwdOpen, setFwdOpen] = useState(false);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    // Define the schema for forwarding rule validation
    const forwardingRuleSchema = z.object({
        url: z.string().url({ message: "Must be a valid URL" }),
        method: z.string().min(1, { message: "Method is required" }),
    });

    // Define the schema for endpoint validation
    const endpointFormSchema = z.object({
        name: z
            .string()
            .min(3, { message: "Endpoint name must be at least 3 characters." })
            .max(50, { message: "Endpoint name must not exceed 50 characters." })
            .regex(/^[a-zA-Z0-9_-]*$/, {
                message: "Endpoint name can only contain letters, numbers, dashes and underscores.",
            })
            .refine((value) => !value.includes("/"), {
                message: "Endpoint name cannot contain '/' character.",
            }),
        description: z
            .string()
            .max(1000, { message: "Description must not exceed 1000 characters." })
            .optional(),
        retentionDays: z.string().optional(),
        forwardingUrls: z.array(forwardingRuleSchema).optional(),
    })

    type EndpointFormValues = z.infer<typeof endpointFormSchema>

    const defaultValues: Partial<EndpointFormValues> = {
        name: "",
        description: "",
        retentionDays: "30",
        forwardingUrls: [],
    }

    // Helper to generate a random valid endpoint name
    function generateRandomEndpointName(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }


    const form = useForm<EndpointFormValues>({
        resolver: zodResolver(endpointFormSchema),
        defaultValues,
        mode: "onSubmit",
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "forwardingUrls",
    });

    const nameValue = form.watch("name");

    // Open the forwarding section once rules exist (e.g. loaded on edit); never
    // auto-closes, so a user who collapses it keeps it collapsed.
    useEffect(() => {
        if (fields.length > 0) setFwdOpen(true);
    }, [fields.length]);

    useEffect(() => {
        if (id && ready) {
            const getEndpointData = async () => {
                const endpoint = await getEndpoint(id)
                form.reset({
                    name: endpoint?.name || "",
                    description: endpoint?.description || "",
                    retentionDays: String(endpoint?.retentionDays ?? 30),
                    forwardingUrls: endpoint?.forwardingUrls || [],
                })
            }
            getEndpointData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, ready])


    async function onSubmit(data: EndpointFormValues) {
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        if (id) {
            try {
                const response = await fetch(`/api/endpoints/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...(id && { id }),
                        userId: user.id,
                        name: data.name,
                        description: data.description,
                        retentionDays: Number(data.retentionDays ?? 30),
                        forwardingUrls: data.forwardingUrls,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to update endpoint`);
                }

                const result = await response.json();
                if (!result.id) return;

                router.push(`/dashboard/${user.id}/${result.id}${!id ? '?isNew=true' : ''}`);
            } catch (error) {
                console.error(`Error updating endpoint:`, error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setIsSubmitting(false);
                return;
            }
        }
        try {
            const response = await fetch('/api/endpoints', {
                method: id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...(id && { id }),
                    userId: user.id,
                    name: data.name,
                    description: data.description,
                    forwardingUrls: data.forwardingUrls,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${id ? 'update' : 'create'} endpoint`);
            }

            const result = await response.json();
            if (!result.id) return;

            router.push(`/dashboard/${user.id}/${result.id}${!id ? '?isNew=true' : ''}`);
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'creating'} endpoint:`, error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    }

    const routeList = [
        {
            label: "Webhook Care",
            href: `/`,
        },
        {
            label: "Dashboard",
            href: `/dashboard/${user?.id}`,
        },
        {
            label: id ? "Edit Endpoint" : "Create Endpoint",
            href: id ? `/dashboard/${user?.id}/${id}/edit` : `/dashboard/${user?.id}/endpoint/create`,
        },
    ]

    return (
        <div className="mx-auto max-w-[820px] py-6">
            <CustomBreadcrumb
                header={id ? "Edit Endpoint" : "Create Endpoint"}
                description={id ? "Edit your existing endpoint." : "Create a new endpoint for your webhooks."}
                routeList={routeList}
            />

            {error && (
                <div className="mt-6 flex items-start gap-2 rounded-md border border-danger-soft bg-danger-soft/40 px-3.5 py-2.5 text-sm text-danger">
                    <AlertCircle className="mt-0.5 size-4 flex-none" />
                    <span>{error}</span>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                    {/* Details */}
                    <Panel>
                        <PanelHead title="Details" />
                        <div className="space-y-6 p-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Endpoint name</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="my-endpoint"
                                                    className="font-mono"
                                                    {...field}
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                className="flex-none"
                                                title="Generate a random name"
                                                onClick={() => form.setValue('name', generateRandomEndpointName(8), { shouldValidate: true })}
                                            >
                                                <Sparkles className="size-4" />
                                            </Button>
                                        </div>

                                        {/* Live webhook URL preview */}
                                        <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-inset px-3 py-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
                                                URL
                                            </span>
                                            <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-mid">
                                                {origin || "…"}/api/webhook/{user?.id ? `${user.id.slice(0, 6)}…` : "…"}/
                                                <span className={nameValue ? "font-semibold text-primary" : "text-dim"}>
                                                    {nameValue || "my-endpoint"}
                                                </span>
                                            </code>
                                        </div>

                                        <FormDescription>
                                            This becomes the endpoint URL path — letters, numbers, dashes and underscores only.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description <span className="font-normal text-dim">(optional)</span></FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the purpose of this endpoint"
                                                className="min-h-20 resize-y"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {id && (
                                <FormField
                                    control={form.control}
                                    name="retentionDays"
                                    render={({ field }) => (
                                        <FormItem className="w-48">
                                            <FormLabel>Retention</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="30 days" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">24 hours</SelectItem>
                                                        <SelectItem value="7">7 days</SelectItem>
                                                        <SelectItem value="30">30 days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormDescription>
                                                How long captured requests are kept before auto-deletion. Pinned requests are always kept.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </Panel>

                    {/* Forwarding — collapsible (optional, collapsed by default) */}
                    <Panel  >
                        <button
                            type="button"
                            onClick={() => setFwdOpen((o) => !o)}
                            aria-expanded={fwdOpen}
                            className={cn(
                                "flex w-full cursor-pointer items-center gap-3 px-[18px] py-[15px] text-left transition-colors hover:bg-elev2",
                                fwdOpen && "border-b border-border"
                            )}
                        >
                            <span className="text-sm font-semibold">Forwarding</span>
                            {fields.length > 0 && (
                                <span className="rounded-full border border-border px-[7px] py-px font-mono text-[11px] text-dim tabular-nums">
                                    {fields.length}
                                </span>
                            )}
                            <span className="ml-auto flex items-center gap-2 text-dim">
                                {!fwdOpen && (
                                    <span className="text-xs">
                                        {fields.length
                                            ? `${fields.length} URL${fields.length > 1 ? "s" : ""}`
                                            : "Optional"}
                                    </span>
                                )}
                                <ChevronDown
                                    className={cn("size-4 transition-transform", fwdOpen && "rotate-180")}
                                />
                            </span>
                        </button>
                        {fwdOpen && (
                        <div className="p-6">
                            {fields.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <div className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-primary">
                                        <Forward className="size-5" strokeWidth={1.7} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold">Forward incoming webhooks</p>
                                        <p className="mx-auto max-w-sm text-[13px] text-dim">
                                            Optionally relay every captured request to one or more URLs
                                            (fire-and-forget). You can add or change these any time.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                        onClick={() => append({ url: "", method: "POST" })}
                                    >
                                        <Plus className="size-4" /> Add forwarding URL
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-[minmax(0,1fr)_120px_auto] gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-faint">
                                        <span>URL</span>
                                        <span>Method</span>
                                        <span className="sr-only">Remove</span>
                                    </div>
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-start gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`forwardingUrls.${index}.url`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="sr-only">URL</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://example.com/webhook" className="min-w-0 font-mono text-xs" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`forwardingUrls.${index}.method`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="sr-only">Method</FormLabel>
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="POST" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="POST">POST</SelectItem>
                                                                    <SelectItem value="GET">GET</SelectItem>
                                                                    <SelectItem value="PUT">PUT</SelectItem>
                                                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="text-dim hover:text-danger"
                                                aria-label="Remove forwarding URL"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}
                    </Panel>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        {!id && (
                            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
                                Reset
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : id ? 'Update endpoint' : 'Create endpoint'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
