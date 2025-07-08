import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Check if push notifications are supported
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

// Request push notification permission
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return { permission: 'denied', subscription: null }
  }
  
  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      const subscription = await subscribeToPushNotifications()
      return { permission, subscription }
    }
    
    return { permission, subscription: null }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return { permission: 'denied', subscription: null }
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready
    
    // Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription()
    
    if (!subscription) {
      // This is where you would normally get your VAPID public key from your server
      // For now, we'll use a placeholder
      const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })
      
      // In a real app, you would send this subscription to your server
      // await sendSubscriptionToServer(subscription)
    }
    
    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      // In a real app, you would notify your server about the unsubscription
      // await removeSubscriptionFromServer(subscription)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return false
  }
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}
