
'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/sync';

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface OfflineActions {
  forceSync: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getQueueStatus: () => Promise<{
    pending: number;
    failed: number;
    nextSync?: Date;
  }>;
  retryFailedSync: () => Promise<void>;
}

const getConnectionInfo = (): Partial<OfflineState> => {
  if (typeof navigator === 'undefined') {
    return {};
  }

  const connection = (navigator as any).connection || 
                   (navigator as any).mozConnection || 
                   (navigator as any).webkitConnection;

  if (!connection) {
    return {
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }

  return {
    connectionType: connection.type || 'unknown',
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
};

export function useOffline(): OfflineState & OfflineActions {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo);

  useEffect(() => {
    // Initialize online state
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      setLastOnline(new Date());
    }

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
      setConnectionInfo(getConnectionInfo());
      
      // Trigger sync when coming back online
      syncManager.processSyncQueue();
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('app-online'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionInfo(getConnectionInfo());
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('app-offline'));
    };

    const handleConnectionChange = () => {
      setConnectionInfo(getConnectionInfo());
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Periodic online check (fallback)
    const onlineCheck = setInterval(() => {
      if (navigator.onLine !== isOnline) {
        if (navigator.onLine) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(onlineCheck);
    };
  }, [isOnline]);

  const forceSync = useCallback(async () => {
    if (isOnline) {
      await syncManager.processSyncQueue();
    }
  }, [isOnline]);

  const clearOfflineData = useCallback(async () => {
    try {
      const { db } = await import('@/lib/db');
      await db.clearSyncedData();
      await syncManager.clearFailedOperations();
    } catch (error) {
      console.error('[Offline] Failed to clear offline data:', error);
    }
  }, []);

  const getQueueStatus = useCallback(async () => {
    return await syncManager.getQueueStatus();
  }, []);

  const retryFailedSync = useCallback(async () => {
    await syncManager.retryFailedOperations();
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnline,
    connectionType: connectionInfo.connectionType || 'unknown',
    effectiveType: connectionInfo.effectiveType || 'unknown',
    downlink: connectionInfo.downlink || 0,
    rtt: connectionInfo.rtt || 0,
    saveData: connectionInfo.saveData || false,
    forceSync,
    clearOfflineData,
    getQueueStatus,
    retryFailedSync
  };
}
</new_str>
