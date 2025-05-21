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
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getEndpoint } from './api/endpoints'

export default function EndpointEditForm({ id }: { id?: string }) {

    const router = useRouter();
    const user = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        forwardingUrls: z.array(forwardingRuleSchema).optional(),
    })

    type EndpointFormValues = z.infer<typeof endpointFormSchema>

    const defaultValues: Partial<EndpointFormValues> = {
        name: "",
        description: "",
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


    // TODO: add edit functionality
    const form = useForm<EndpointFormValues>({
        resolver: zodResolver(endpointFormSchema),
        defaultValues,
        mode: "onSubmit",
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "forwardingUrls",
    });

    useEffect(() => {
        if (id) {
            const getEndpointData = async () => {
                const endpoint = await getEndpoint(id)
                form.reset({
                    name: endpoint?.name || "",
                    description: endpoint?.description || "",
                    forwardingUrls: endpoint?.forwardingUrls || [],
                })
            }
            getEndpointData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])


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
                        forwardingUrls: data.forwardingUrls,
                    }),
                });
                console.log(response)
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
        <div className=" mx-auto py-6 ">
            <div>
                <CustomBreadcrumb
                    header={id ? "Edit Endpoint" : "Create Endpoint"}
                    description={id ? "Edit your existing endpoint." : "Create a new endpoint for your webhooks."}
                    routeList={routeList}
                />
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                    {error}
                </div>
            )}
            <Card className='my-8'>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Endpoint Name</FormLabel>
                                        <div className="flex gap-2 items-center">
                                            <FormControl>
                                                <Input
                                                    placeholder="my-endpoint"
                                                    {...field}
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                title="Generate random name"
                                                onClick={() => form.setValue('name', generateRandomEndpointName(8))}
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            This will be the endpoint URL path. Use only letters, numbers, dashes, and underscores.
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
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the purpose of this endpoint"
                                                className="resize-y"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            A brief description of what this endpoint is used for.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Forwarding Rules Dynamic Array */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">Forwarding Urls</span>
                                    <Button size="icon" variant="outline" onClick={() => append({ url: "", method: "POST" })}><Plus /></Button>
                                </div>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-end mb-2">
                                        <FormField
                                            control={form.control}
                                            name={`forwardingUrls.${index}.url`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://example.com/webhook" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`forwardingUrls.${index}.method`}
                                            render={({ field }) => (
                                                <FormItem className="w-32">
                                                    <FormLabel>Method</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            defaultValue="POST"
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="POST" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="POST">POST</SelectItem>
                                                                <SelectItem value="GET">GET</SelectItem>
                                                                <SelectItem value="DELETE">DELETE</SelectItem>
                                                                <SelectItem value="PUT">PUT</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className='flex gap-2'>
                                            <Button size="icon" variant="outline" onClick={() => append({ url: "", method: "POST" })}><Plus /></Button>
                                            <Button size="icon" variant="destructive" onClick={() => remove(index)} ><Trash2 /></Button>
                                        </div>

                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 justify-end">
                                <Button size="sm" type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
                                    Reset
                                </Button>
                                <Button size="sm" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : id ? 'Update Endpoint' : 'Create Endpoint'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}