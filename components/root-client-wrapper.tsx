"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { ThemeProvider } from "@/components/theme-context"
import { Toaster } from "@/components/ui/toaster"
import { LoadingScreen } from "@/components/loading-screen"
import { useAuth } from "@/contexts/auth-context"

// Memoize components that don't need to re-render with state changes
const MemoizedToaster = memo(Toaster)

export function RootClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const { isLoading: authLoading } = useAuth()
  
  // Memoize the online status handler to prevent unnecessary re-renders
  const handleOnlineStatus = useCallback(() => {
    setIsOnline(navigator.onLine)
    
    // Show toast notification when status changes
    if (navigator.onLine) {
      // Could show a toast notification here that we're back online
    } else {
      // Could show a toast notification here that we're offline
    }
  }, [])
  
  // Handle online/offline status
  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)
    
    // Add event listeners
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [handleOnlineStatus])

  // Prevent transitions on page load
  useEffect(() => {
    // Add no-transition class to prevent transitions on page load
    document.documentElement.classList.add('no-transition')
    
    // Remove the class after a short delay to allow transitions after initial load
    const timeoutId = setTimeout(() => {
      document.documentElement.classList.remove('no-transition')
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Handle initial app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 1500) // Show loading screen for 1.5 seconds minimum

    return () => clearTimeout(timer)
  }, [])

  // Show loading screen during auth loading or initial app loading
  const shouldShowLoading = authLoading || isInitializing

  if (shouldShowLoading) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider>
      {children}
      <MemoizedToaster />
    </ThemeProvider>
  )
} 