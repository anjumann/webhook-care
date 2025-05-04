"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useUser } from "@/hooks/useUser"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { avatarFiles } from "@/constant"
import { getProfile, updateProfile } from "@/profile/api"

// Define the schema for profile validation
const profileFormSchema = z.object({
  userName: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not exceed 30 characters." }),
  userImage: z.string(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfilePage() {
  const { id } = useUser()




  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      userName: "",
      userImage: avatarFiles[0],
    },
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return
      const response = await getProfile(id)
      form.setValue('userName', response.userName)
      form.setValue('userImage', response.userImage.replace('/avatar/', ''))
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  async function onSubmit(data: ProfileFormValues) {
    if (!id) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updateProfile(id, data.userName, data.userImage)
      form.reset(
        {
          userName: result.userName,
          userImage: result.userImage.replace('/avatar/', ''),
        }   
      )
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userImage"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8"
                    >
                      {avatarFiles.map((avatar) => (
                        <FormItem key={avatar}>
                          <FormControl>
                            <RadioGroupItem
                              value={avatar}
                              className="sr-only"
                              id={avatar}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={avatar}
                            className="cursor-pointer [&:has([data-state=checked])>div]:border-primary"
                          >
                            <div className={`relative aspect-square overflow-hidden rounded-lg border-2 border-muted transition-all hover:border-ring ${field.value === avatar ? ' border-4 border-primary' : ''}`}>
                              <Image
                                src={`/avatar/${avatar}`}
                                alt={avatar}
                                className="object-contain"
                                height={100}
                                width={100}
                                sizes="(max-width: 768px) 25vw, (max-width: 1024px) 16.67vw, 12.5vw"
                              />
                            </div>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}