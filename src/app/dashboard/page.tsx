"use client"

import { useUser } from "@/hooks/useUser"
import { redirect } from "next/navigation"

const DashboardPage = () => {
    const { id, loading } = useUser()

    // Wait for user data to load
    if (loading) {
        // add loading state 
        return null // or return a loading spinner component
    }

    if(id) {
        return redirect(`/dashboard/${id}`)
    }
    return redirect(`/`)
}

export default DashboardPage