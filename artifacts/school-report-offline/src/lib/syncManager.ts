import { db, type OfflineScore, type OfflineSyncQueueItem } from './db';

// Simple event target so UI components can listen to sync events
export const syncEvents = new EventTarget();

export class SyncManager {
  private isSyncing = false;

  /**
   * Add a score update to the queue and execute sync if online.
   */
  async queueScoreUpdate(
    studentId: number,
    assessmentComponentId: number,
    scoreValue: number,
    teacherId: number | null
  ) {
    const timestamp = new Date().toISOString();

    // 1. Save or update score locally in Dexie database with isPendingSync flag
    const existing = await db.scores
      .where('[studentId+assessmentComponentId]')
      .equals([studentId, assessmentComponentId])
      .first();

    if (existing) {
      await db.scores.update(existing.id!, {
        scoreValue,
        teacherId,
        isPendingSync: true,
        lastEditedAt: timestamp,
      });
    } else {
      await db.scores.add({
        studentId,
        assessmentComponentId,
        teacherId,
        scoreValue,
        isLocked: false,
        enteredAt: timestamp,
        isPendingSync: true,
      });
    }

    // 2. Add to Sync Queue
    await db.syncQueue.add({
      type: 'PUT_SCORE',
      payload: {
        studentId,
        assessmentComponentId,
        scoreValue,
        teacherId,
        timestamp,
      },
      status: 'pending',
      retryCount: 0,
    });

    syncEvents.dispatchEvent(new Event('queue-changed'));

    // 3. Trigger background sync immediately (non-blocking)
    this.triggerSync();
  }

  /**
   * Process all pending items in the sync queue if online.
   */
  async triggerSync() {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      console.log("[Sync] Device is offline. Skipping sync trigger.");
      return;
    }

    const pendingCount = await db.syncQueue.where('status').equals('pending').count();
    if (pendingCount === 0) return;

    this.isSyncing = true;
    syncEvents.dispatchEvent(new CustomEvent('sync-started'));
    console.log(`[Sync] Starting sync. Found ${pendingCount} items in queue.`);

    try {
      const items = await db.syncQueue.where('status').equals('pending').toArray();

      for (const item of items) {
        // Double check network online status before processing each item
        if (!navigator.onLine) break;

        await this.syncItem(item);
      }
    } catch (err) {
      console.error("[Sync] Error running queue sync:", err);
    } finally {
      this.isSyncing = false;
      syncEvents.dispatchEvent(new CustomEvent('sync-stopped'));
    }
  }

  /**
   * Sync a single queue item to the server.
   */
  private async syncItem(item: OfflineSyncQueueItem) {
    await db.syncQueue.update(item.id!, { status: 'syncing' });
    syncEvents.dispatchEvent(new Event('queue-changed'));

    try {
      if (item.type === 'PUT_SCORE') {
        const response = await fetch('/api/scores', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: item.payload.studentId,
            assessmentComponentId: item.payload.assessmentComponentId,
            scoreValue: item.payload.scoreValue,
          }),
        });

        if (response.ok) {
          // Success: Clear item from queue
          await db.syncQueue.delete(item.id!);
          
          // Clear isPendingSync flag on the local score
          const localScore = await db.scores
            .where('[studentId+assessmentComponentId]')
            .equals([item.payload.studentId, item.payload.assessmentComponentId])
            .first();

          if (localScore && localScore.isPendingSync) {
            await db.scores.update(localScore.id!, { isPendingSync: false });
          }

          console.log(`[Sync] Synced score successfully for student ${item.payload.studentId}`);
        } else {
          // Server returned an error (e.g. 400 Validation, 401 Unauthorized)
          const errorMsg = await response.text();
          console.error(`[Sync] Server rejected sync item: ${errorMsg}`);
          
          await db.syncQueue.update(item.id!, {
            status: 'failed',
            error: errorMsg || `HTTP error ${response.status}`,
            retryCount: item.retryCount + 1,
          });
        }
      }
    } catch (err: any) {
      console.warn("[Sync] Network error syncing item. Will retry when connection returns:", err);
      // Put back to pending state for automatic retry later
      await db.syncQueue.update(item.id!, {
        status: 'pending',
        error: err.message || 'Network Fetch Error',
      });
    }

    syncEvents.dispatchEvent(new Event('queue-changed'));
  }

  /**
   * Fetch latest students, metadata and classes from the online database.
   * Typically called when logging in or when clicking a "Refresh Data" button.
   */
  async downloadServerMetadata() {
    if (!navigator.onLine) {
      throw new Error("Cannot refresh metadata while offline.");
    }

    console.log("[Sync] Fetching latest metadata from server...");
    
    // Fetch terms, classes, students, assessment components
    const [termsRes, classesRes, studentsRes] = await Promise.all([
      fetch('/api/terms'),
      fetch('/api/classes'),
      fetch('/api/students'),
    ]);

    if (!termsRes.ok || !classesRes.ok || !studentsRes.ok) {
      throw new Error("Failed to download school metadata from server.");
    }

    const terms = await termsRes.json();
    const classes = await classesRes.json();
    const students = await studentsRes.json();

    // Reset local database structures with fresh master copy
    await db.transaction('rw', [db.classes, db.students], async () => {
      await db.classes.clear();
      await db.students.clear();

      await db.classes.bulkAdd(classes);
      await db.students.bulkAdd(students);
    });

    console.log(`[Sync] Metadata refreshed. Cached ${classes.length} classes and ${students.length} students.`);
    syncEvents.dispatchEvent(new Event('metadata-refreshed'));
  }
}

export const syncManager = new SyncManager();

// Automatically listen to network online status shifts to run sync
window.addEventListener('online', () => {
  console.log("[Network] Connection restored. Triggering sync queue...");
  syncManager.triggerSync();
});
