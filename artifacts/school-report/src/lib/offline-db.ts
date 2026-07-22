// Offline IndexedDB Storage & Sync Engine for System B (PWA)

const DB_NAME = "SchoolManagementOfflineDB";
const DB_VERSION = 1;

export interface SyncQueueItem {
  id: string;
  url: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  body: any;
  timestamp: number;
  attempts: number;
}

export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("students")) {
        db.createObjectStore("students", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("scores")) {
        db.createObjectStore("scores", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("attendance")) {
        db.createObjectStore("attendance", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("studentTermMetadata")) {
        db.createObjectStore("studentTermMetadata", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("classes")) {
        db.createObjectStore("classes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("subjects")) {
        db.createObjectStore("subjects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("assessmentComponents")) {
        db.createObjectStore("assessmentComponents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("terms")) {
        db.createObjectStore("terms", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncMeta")) {
        db.createObjectStore("syncMeta", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Write delta response from GET /api/sync/delta into IndexedDB
export async function applyDeltaSnapshot(delta: {
  serverTime: string;
  students?: any[];
  scores?: any[];
  attendance?: any[];
  studentTermMetadata?: any[];
  classes?: any[];
  subjects?: any[];
  assessmentComponents?: any[];
  terms?: any[];
}) {
  const db = await openOfflineDB();
  const tx = db.transaction(
    ["students", "scores", "attendance", "studentTermMetadata", "classes", "subjects", "assessmentComponents", "terms", "syncMeta"],
    "readwrite"
  );

  const putItems = (storeName: string, items?: any[]) => {
    if (!items || items.length === 0) return;
    const store = tx.objectStore(storeName);
    items.forEach((item) => store.put(item));
  };

  putItems("students", delta.students);
  putItems("scores", delta.scores);
  putItems("attendance", delta.attendance);
  putItems("studentTermMetadata", delta.studentTermMetadata);
  putItems("classes", delta.classes);
  putItems("subjects", delta.subjects);
  putItems("assessmentComponents", delta.assessmentComponents);
  putItems("terms", delta.terms);

  const metaStore = tx.objectStore("syncMeta");
  metaStore.put({ key: "lastSyncTime", value: delta.serverTime });

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Save a pending mutation to IndexedDB queue when offline
export async function enqueueMutation(url: string, method: "POST" | "PUT" | "DELETE" | "PATCH", body: any): Promise<string> {
  const db = await openOfflineDB();
  const tx = db.transaction(["syncQueue"], "readwrite");
  const store = tx.objectStore("syncQueue");

  const queueItem: SyncQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    method,
    body,
    timestamp: Date.now(),
    attempts: 0,
  };

  store.put(queueItem);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(queueItem.id);
    tx.onerror = () => reject(tx.error);
  });
}

// Process pending mutations in queue when internet connection is restored
export async function flushSyncQueue(onProgress?: (pendingCount: number) => void): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) return { success: 0, failed: 0 };

  const db = await openOfflineDB();
  const getTx = db.transaction(["syncQueue"], "readonly");
  const store = getTx.objectStore("syncQueue");

  const items: SyncQueueItem[] = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as SyncQueueItem[]);
    req.onerror = () => reject(req.error);
  });

  if (items.length === 0) return { success: 0, failed: 0 };

  // Sort queue by timestamp (FIFO)
  items.sort((a, b) => a.timestamp - b.timestamp);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok) {
        // Remove processed item from queue
        const delTx = db.transaction(["syncQueue"], "readwrite");
        delTx.objectStore("syncQueue").delete(item.id);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    if (onProgress) {
      onProgress(items.length - (i + 1));
    }
  }

  // After processing queue, trigger a delta sync to fetch updated server state
  try {
    const metaTx = db.transaction(["syncMeta"], "readonly");
    const req = metaTx.objectStore("syncMeta").get("lastSyncTime");
    req.onsuccess = async () => {
      const lastSync = req.result?.value;
      const url = lastSync ? `/api/sync/delta?since=${encodeURIComponent(lastSync)}` : "/api/sync/delta";
      const deltaRes = await fetch(url);
      if (deltaRes.ok) {
        const delta = await deltaRes.json();
        await applyDeltaSnapshot(delta);
      }
    };
  } catch {
    // Ignore background delta refresh errors
  }

  return { success, failed };
}

// Get count of queued mutations
export async function getPendingQueueCount(): Promise<number> {
  const db = await openOfflineDB();
  const tx = db.transaction(["syncQueue"], "readonly");
  const store = tx.objectStore("syncQueue");

  return new Promise((resolve, reject) => {
    const countReq = store.count();
    countReq.onsuccess = () => resolve(countReq.result);
    countReq.onerror = () => reject(countReq.error);
  });
}
