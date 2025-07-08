
export interface SyncOperation {
  id: string;
  type: 'api-call' | 'upload' | 'delete' | 'update';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  priority: 'low' | 'normal' | 'high';
  retries: number;
  maxRetries: number;
  timestamp: number;
  lastAttempt?: number;
  error?: string;
}

class SyncManager {
  private syncQueue: SyncOperation[] = [];
  private isOnline = true;
  private syncInProgress = false;
  private maxConcurrentSyncs = 3;
  private retryDelays = [1000, 3000, 10000, 30000]; // Exponential backoff

  constructor() {
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[Sync] Network is back online');
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[Sync] Network is offline');
      this.isOnline = false;
    });

    // Listen for page visibility changes to sync when app becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const { db } = await import('./db');
      const pendingOperations = await db.getPendingSyncData();
      
      this.syncQueue = pendingOperations.map(item => ({
        id: item.id,
        type: 'api-call',
        endpoint: item.data.endpoint || '/api/sync',
        method: item.data.method || 'POST',
        data: item.data,
        priority: 'normal',
        retries: 0,
        maxRetries: 3,
        timestamp: item.timestamp
      }));

      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('[Sync] Failed to load sync queue:', error);
    }
  }

  async addToQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    this.syncQueue.push(syncOperation);
    
    // Persist to IndexedDB
    try {
      const { db } = await import('./db');
      await db.addSyncData({
        action: 'create',
        collection: 'syncOperations',
        data: syncOperation
      });
    } catch (error) {
      console.error('[Sync] Failed to persist sync operation:', error);
    }

    if (this.isOnline) {
      this.processSyncQueue();
    }

    return syncOperation.id;
  }

  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`[Sync] Processing ${this.syncQueue.length} operations`);

    try {
      // Sort by priority and timestamp
      const sortedQueue = [...this.syncQueue].sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      // Process operations in batches
      const batches = this.chunkArray(sortedQueue, this.maxConcurrentSyncs);
      
      for (const batch of batches) {
        await Promise.allSettled(
          batch.map(operation => this.processOperation(operation))
        );
      }
    } finally {
      this.syncInProgress = false;
    }

    // If there are still operations in the queue, schedule another attempt
    if (this.syncQueue.length > 0) {
      setTimeout(() => this.processSyncQueue(), 5000);
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    try {
      console.log(`[Sync] Processing operation ${operation.id}`);
      
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json',
          ...operation.headers
        },
        body: operation.data ? JSON.stringify(operation.data) : undefined
      });

      if (response.ok) {
        // Operation successful
        await this.removeFromQueue(operation.id);
        console.log(`[Sync] Operation ${operation.id} completed successfully`);
        
        // Dispatch success event
        this.dispatchSyncEvent('sync-success', { operation, response });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[Sync] Operation ${operation.id} failed:`, error);
      await this.handleOperationFailure(operation, error as Error);
    }
  }

  private async handleOperationFailure(operation: SyncOperation, error: Error): Promise<void> {
    operation.retries++;
    operation.lastAttempt = Date.now();
    operation.error = error.message;

    if (operation.retries >= operation.maxRetries) {
      // Max retries reached, remove from queue and log error
      await this.removeFromQueue(operation.id);
      console.error(`[Sync] Operation ${operation.id} failed permanently after ${operation.retries} attempts`);
      
      // Dispatch failure event
      this.dispatchSyncEvent('sync-failed', { operation, error });
    } else {
      // Schedule retry with exponential backoff
      const delay = this.retryDelays[Math.min(operation.retries - 1, this.retryDelays.length - 1)];
      setTimeout(() => {
        if (this.isOnline) {
          this.processSyncQueue();
        }
      }, delay);
      
      console.log(`[Sync] Retrying operation ${operation.id} in ${delay}ms (attempt ${operation.retries}/${operation.maxRetries})`);
    }
  }

  private async removeFromQueue(operationId: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    
    try {
      const { db } = await import('./db');
      await db.markSyncDataAsComplete(operationId);
    } catch (error) {
      console.error('[Sync] Failed to mark sync data as complete:', error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private dispatchSyncEvent(type: string, detail: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(type, { detail }));
    }
  }

  // Public API methods
  async getQueueStatus(): Promise<{
    pending: number;
    failed: number;
    nextSync?: Date;
  }> {
    const pending = this.syncQueue.filter(op => op.retries < op.maxRetries).length;
    const failed = this.syncQueue.filter(op => op.retries >= op.maxRetries).length;
    
    const nextOperation = this.syncQueue
      .filter(op => op.retries < op.maxRetries)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    const nextSync = nextOperation?.lastAttempt 
      ? new Date(nextOperation.lastAttempt + this.retryDelays[Math.min(nextOperation.retries, this.retryDelays.length - 1)])
      : undefined;

    return { pending, failed, nextSync };
  }

  async clearFailedOperations(): Promise<void> {
    const failedOperations = this.syncQueue.filter(op => op.retries >= op.maxRetries);
    
    for (const operation of failedOperations) {
      await this.removeFromQueue(operation.id);
    }
  }

  async retryFailedOperations(): Promise<void> {
    this.syncQueue.forEach(operation => {
      if (operation.retries >= operation.maxRetries) {
        operation.retries = 0;
        operation.error = undefined;
        operation.lastAttempt = undefined;
      }
    });

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }
}

export const syncManager = new SyncManager();

// Convenience functions for common sync operations
export const syncOperations = {
  async syncUserData(userData: any): Promise<string> {
    return syncManager.addToQueue({
      type: 'api-call',
      endpoint: '/api/user/sync',
      method: 'POST',
      data: userData,
      priority: 'high',
      maxRetries: 5
    });
  },

  async syncMessData(messData: any): Promise<string> {
    return syncManager.addToQueue({
      type: 'api-call',
      endpoint: '/api/mess/sync',
      method: 'POST',
      data: messData,
      priority: 'normal',
      maxRetries: 3
    });
  },

  async uploadFile(file: File, endpoint: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    return syncManager.addToQueue({
      type: 'upload',
      endpoint,
      method: 'POST',
      data: formData,
      priority: 'normal',
      maxRetries: 3,
      headers: {
        // Don't set Content-Type for FormData
      }
    });
  }
};
</new_str>
