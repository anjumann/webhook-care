"use client"

import { useUser } from "@/hooks/useUser"
import { redirect } from "next/navigation"
import { useEffect } from "react"

const DashboardPage = () => {
    const { id, loading } = useUser()

    useEffect(() => {
        if (!loading && id) {
            redirect(`/dashboard/${id}`)
        }
    }, [id, loading])

    return redirect(`/`)
}

export default DashboardPage