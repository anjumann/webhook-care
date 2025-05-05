"use client"

import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
        .max(200, { message: "Description must not exceed 200 characters." })
        .optional(),
})

type EndpointFormValues = z.infer<typeof endpointFormSchema>

const defaultValues: Partial<EndpointFormValues> = {
    name: "",
    description: "",
}

export default function EndpointEditForm() {
    const router = useRouter();
    const user = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // TODO: add edit functionality
    const form = useForm<EndpointFormValues>({
        resolver: zodResolver(endpointFormSchema),
        defaultValues,
    })

    async function onSubmit(data: EndpointFormValues) {
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/endpoints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    name: data.name,
                    description: data.description,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create endpoint');
            }

            const result = await response.json();
            if (!result.id) return
            router.push(`/dashboard/${user.id}`);
        } catch (error) {
            console.error('Error creating endpoint:', error);
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
            label: "Create Endpoint",
            href: `/dashboard/${user?.id}/endpoint/create`,
        },
    ]
    return (
        <div className="container mx-auto py-10">
            <div className="max-w-11/12 mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Create Endpoint</h1>
                    <p className="text-muted-foreground">Create a new endpoint for your webhooks.</p>
                    <div className="flex items-center gap-2 mt-2 "> 
                        <CustomBreadcrumb routeList={routeList} />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                        {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"

                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endpoint Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="my-endpoint"
                                            {...field}
                                            autoFocus
                                        />
                                    </FormControl>
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

                        <div className="flex gap-4 justify-end">
                            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Endpoint'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}