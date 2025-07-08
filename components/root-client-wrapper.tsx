"use client"

import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/contexts/auth-context"
import { PWAStatus } from "@/components/pwa-status"
import { InstallPrompt } from "@/components/install-prompt"
import { useOffline } from "@/hooks/use-offline"

export function RootClientWrapper({ children }: { children: React.ReactNode }) {
  const { isOnline } = useOffline()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize IndexedDB
        const { db } = await import('@/lib/db')
        await db.init()
        console.log('[PWA] Database initialized')

        // Initialize notifications
        const { notificationManager } = await import('@/lib/notifications')
        await notificationManager.init()
        console.log('[PWA] Notification manager initialized')

        // Register service worker manually if needed
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none'
            })

            registration.addEventListener('updatefound', () => {
              console.log('[PWA] Service worker update found')
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker is available
                    window.dispatchEvent(new CustomEvent('sw-update-available'))
                  }
                })
              }
            })

            console.log('[PWA] Service worker registered')
          } catch (error) {
            console.error('[PWA] Service worker registration failed:', error)
          }
        }

        setInitialized(true)
      } catch (error) {
        console.error('[PWA] Initialization failed:', error)
        setInitialized(true) // Continue even if some services fail
      }
    }

    initializeServices()

    // Listen for app update events
    const handleAppUpdate = () => {
      if (confirm('A new version of MessHub is available. Reload to update?')) {
        window.location.reload()
      }
    }

    window.addEventListener('sw-update-available', handleAppUpdate)

    return () => {
      window.removeEventListener('sw-update-available', handleAppUpdate)
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
        <Toaster />
        {initialized && (
          <>
            <PWAStatus isOnline={isOnline} />
            <InstallPrompt />
          </>
        )}
      </AuthProvider>
    </ThemeProvider>
  )
}