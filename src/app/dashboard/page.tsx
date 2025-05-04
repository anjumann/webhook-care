"use client"

import { useUser } from "@/hooks/useUser"
import { redirect } from "next/navigation"
import { useEffect } from "react"

const DashboardPage = () => {
    const { user, loading } = useUser()

    useEffect(() => {
        if (!loading && user?.id) {
            redirect(`/dashboard/${user.id}`)
        }
    }, [user, loading])

    // Optionally, show a loading indicator
    return null
}

export default DashboardPage