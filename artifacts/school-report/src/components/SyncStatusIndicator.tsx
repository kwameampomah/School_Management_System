import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { flushSyncQueue, getPendingQueueCount, applyDeltaSnapshot } from "@/lib/offline-db";

export default function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { toast } = useToast();

  const updateQueueCount = useCallback(async () => {
    try {
      const count = await getPendingQueueCount();
      setPendingCount(count);
    } catch {
      // Ignore DB read errors
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      // 1. Initial snapshot fetch if needed
      const deltaRes = await fetch("/api/sync/delta");
      if (deltaRes.ok) {
        const delta = await deltaRes.json();
        await applyDeltaSnapshot(delta);
      }

      // 2. Flush pending mutations queue
      const { success, failed } = await flushSyncQueue((remaining) => setPendingCount(remaining));
      await updateQueueCount();

      if (success > 0 || failed > 0) {
        toast({
          title: "Sync Completed",
          description: `Synced ${success} changes successfully.${failed > 0 ? ` (${failed} failed)` : ""}`,
        });
      }
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast, updateQueueCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Online Mode Activated", description: "Network restored. Syncing changes..." });
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Offline Mode Active",
        description: "Network disconnected. Scores and metadata will be saved locally.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Interval check for queue count
    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [handleSync, toast, updateQueueCount]);

  return (
    <div className="flex items-center gap-2 text-xs">
      {isOnline ? (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 py-1 px-2.5">
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </Badge>
      ) : (
        <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2.5">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline Mode</span>
        </Badge>
      )}

      {pendingCount > 0 && (
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-mono">
          {pendingCount} Pending
        </Badge>
      )}

      {isOnline && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1 text-primary" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
          )}
          {isSyncing ? "Syncing..." : "Sync"}
        </Button>
      )}
    </div>
  );
}
