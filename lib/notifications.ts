
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  timestamp: number;
  category: NotificationCategory;
  priority: NotificationPriority;
  userId: string;
  read: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationCategory = 
  | 'meal-ready'
  | 'payment-due'
  | 'leave-approved'
  | 'leave-rejected'
  | 'system-update'
  | 'promotion'
  | 'reminder'
  | 'emergency';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
  canPrompt: boolean;
}

class NotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready;
        console.log('[Notifications] Service Worker ready');
      } catch (error) {
        console.error('[Notifications] Service Worker registration failed:', error);
      }
    }
  }

  getPermissionState(): NotificationPermissionState {
    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
      canPrompt: permission === 'default'
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[Notifications] This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('[Notifications] Service Worker not available');
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[Notifications] Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Notifications] Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) return null;
    
    try {
      return await this.swRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Notifications] Failed to get subscription:', error);
      return null;
    }
  }

  async showLocalNotification(data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): Promise<void> {
    if (!this.getPermissionState().granted) {
      console.warn('[Notifications] Permission not granted');
      return;
    }

    const notificationData: NotificationData = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false
    };

    // Store in IndexedDB
    await import('./db').then(({ db }) => 
      db.put('notifications', notificationData)
    );

    // Show notification
    if (this.swRegistration) {
      await this.swRegistration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        image: data.image,
        badge: data.badge || '/icon-96x96.png',
        tag: data.tag,
        data: { ...data.data, notificationId: notificationData.id },
        actions: data.actions,
        vibrate: this.getVibrationPattern(data.priority),
        silent: data.priority === 'low',
        requireInteraction: data.priority === 'urgent'
      });
    } else {
      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        tag: data.tag,
        data: data.data
      });
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { db } = await import('./db');
    const notification = await db.get<NotificationData>('notifications', notificationId);
    
    if (notification) {
      notification.read = true;
      await db.put('notifications', notification);
    }
  }

  async getNotifications(userId: string, limit = 50): Promise<NotificationData[]> {
    const { db } = await import('./db');
    const allNotifications = await db.getAll<NotificationData>('notifications');
    
    return allNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async clearNotifications(userId: string): Promise<void> {
    const { db } = await import('./db');
    const notifications = await this.getNotifications(userId);
    
    for (const notification of notifications) {
      await db.delete('notifications', notification.id);
    }
  }

  private getVibrationPattern(priority: NotificationPriority): number[] {
    switch (priority) {
      case 'urgent':
        return [200, 100, 200, 100, 200];
      case 'high':
        return [200, 100, 200];
      case 'normal':
        return [200];
      case 'low':
      default:
        return [];
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }),
      });
    } catch (error) {
      console.error('[Notifications] Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });
    } catch (error) {
      console.error('[Notifications] Failed to remove subscription from server:', error);
    }
  }
}

export const notificationManager = new NotificationManager();

// Notification templates
export const NotificationTemplates = {
  mealReady: (messName: string): Omit<NotificationData, 'id' | 'timestamp' | 'read' | 'userId'> => ({
    title: '🍽️ Meal Ready!',
    body: `Your meal is ready at ${messName}`,
    category: 'meal-ready',
    priority: 'normal',
    icon: '/icon-192x192.png',
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }),

  paymentDue: (amount: number, dueDate: string): Omit<NotificationData, 'id' | 'timestamp' | 'read' | 'userId'> => ({
    title: '💳 Payment Due',
    body: `₹${amount} payment is due on ${dueDate}`,
    category: 'payment-due',
    priority: 'high',
    icon: '/icon-192x192.png',
    actions: [
      { action: 'pay', title: 'Pay Now' },
      { action: 'remind-later', title: 'Remind Later' }
    ]
  }),

  leaveStatus: (status: 'approved' | 'rejected', dates: string): Omit<NotificationData, 'id' | 'timestamp' | 'read' | 'userId'> => ({
    title: `Leave ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
    body: `Your leave request for ${dates} has been ${status}`,
    category: status === 'approved' ? 'leave-approved' : 'leave-rejected',
    priority: 'normal',
    icon: '/icon-192x192.png',
    actions: [
      { action: 'view', title: 'View Details' }
    ]
  }),

  systemUpdate: (version: string): Omit<NotificationData, 'id' | 'timestamp' | 'read' | 'userId'> => ({
    title: '🔄 App Update Available',
    body: `Version ${version} is now available with new features`,
    category: 'system-update',
    priority: 'low',
    icon: '/icon-192x192.png',
    actions: [
      { action: 'update', title: 'Update Now' },
      { action: 'later', title: 'Later' }
    ]
  })
};
