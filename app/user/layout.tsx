"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingScreen } from "@/components/loading-screen"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "user")) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || user?.role !== "user") {
    return null
  }

  return <div className="min-h-screen bg-background">{children}</div>
} 