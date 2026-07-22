// Native Background Sync Engine for System B (React Native Expo)

export interface SyncResult {
  syncedCount: number;
  conflictsCount: number;
  errorsCount: number;
}

export async function processSyncQueue(
  apiBaseUrl: string,
  fetchQueueFn: () => Promise<Array<{ id: number; type: string; recordId: string; payload: string }>>,
  markSyncedFn: (id: number, serverId?: string) => Promise<void>,
  markConflictFn: (recordId: string, type: string, localData: string, serverData: string) => Promise<void>
): Promise<SyncResult> {
  let syncedCount = 0;
  let conflictsCount = 0;
  let errorsCount = 0;

  try {
    const pendingItems = await fetchQueueFn();

    for (const item of pendingItems) {
      try {
        const payload = JSON.parse(item.payload);
        const response = await fetch(`${apiBaseUrl}/api/sync/mutate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: item.type, recordId: item.recordId, data: payload }),
        });

        if (response.status === 409) {
          // Conflict detected
          const serverData = await response.text();
          await markConflictFn(item.recordId, item.type, item.payload, serverData);
          conflictsCount++;
        } else if (response.ok) {
          const result = await response.json();
          await markSyncedFn(item.id, result.serverId);
          syncedCount++;
        } else {
          errorsCount++;
        }
      } catch (err) {
        errorsCount++;
      }
    }
  } catch (err) {
    // Network or DB error
  }

  return { syncedCount, conflictsCount, errorsCount };
}
