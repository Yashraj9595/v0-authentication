
export interface DBConfig {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: Array<{
      name: string;
      keyPath: string | string[];
      unique?: boolean;
    }>;
  }[];
}

export interface SyncData {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class DatabaseManager {
  private db: IDBDatabase | null = null;
  private config: DBConfig;

  constructor(config: DBConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        this.config.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement
            });

            storeConfig.indexes?.forEach(index => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique
              });
            });
          }
        });
      };
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addSyncData(data: Omit<SyncData, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const syncData: SyncData = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false
    };

    await this.put('syncQueue', syncData);
  }

  async getPendingSyncData(): Promise<SyncData[]> {
    const allData = await this.getAll<SyncData>('syncQueue');
    return allData.filter(item => !item.synced);
  }

  async markSyncDataAsComplete(id: string): Promise<void> {
    const data = await this.get<SyncData>('syncQueue', id);
    if (data) {
      data.synced = true;
      await this.put('syncQueue', data);
    }
  }

  async clearSyncedData(): Promise<void> {
    const allData = await this.getAll<SyncData>('syncQueue');
    const syncedData = allData.filter(item => item.synced);
    
    for (const item of syncedData) {
      await this.delete('syncQueue', item.id);
    }
  }
}

export const dbConfig: DBConfig = {
  dbName: 'MessHubDB',
  version: 1,
  stores: [
    {
      name: 'userData',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'role', keyPath: 'role', unique: false }
      ]
    },
    {
      name: 'messData',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        { name: 'ownerId', keyPath: 'ownerId', unique: false },
        { name: 'status', keyPath: 'status', unique: false }
      ]
    },
    {
      name: 'notifications',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: false },
        { name: 'read', keyPath: 'read', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'syncQueue',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        { name: 'synced', keyPath: 'synced', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'appSettings',
      keyPath: 'key',
      autoIncrement: false
    }
  ]
};

export const db = new DatabaseManager(dbConfig);
