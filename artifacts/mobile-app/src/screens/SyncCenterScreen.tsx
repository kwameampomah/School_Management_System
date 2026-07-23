import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";

interface SyncQueueItem {
  id: string;
  type: "attendance" | "score";
  description: string;
  timestamp: string;
  status: "pending" | "synced" | "conflict";
}

export default function SyncCenterScreen() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState("Just now");

  const [queue, setQueue] = useState<SyncQueueItem[]>([
    { id: "1", type: "attendance", description: "Attendance: Form 1B (35 marked)", timestamp: "10:15 AM", status: "pending" },
    { id: "2", type: "score", description: "Score Entry: Abena Osei Math CW (42/50)", timestamp: "10:18 AM", status: "pending" },
    { id: "3", type: "score", description: "Score Entry: Albert Owusu Math EX (48/50)", timestamp: "10:20 AM", status: "pending" },
  ]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setQueue((prev) => prev.map((item) => ({ ...item, status: "synced" })));
      setIsSyncing(false);
      setLastSyncedTime(new Date().toLocaleTimeString());
    }, 1200);
  };

  const pendingCount = queue.filter((i) => i.status === "pending").length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline Sync Center</Text>
        <Text style={styles.headerSubtitle}>SQLite Queue • Delta Engine</Text>
      </View>

      {/* Sync Status Overview Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusCount}>{pendingCount}</Text>
            <Text style={styles.statusLabel}>Pending Changes in Queue</Text>
          </View>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeBoxText}>{pendingCount > 0 ? "🔴 OFFLINE QUEUED" : "🟢 ALL SYNCED"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.syncBtn} onPress={handleManualSync} disabled={isSyncing}>
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.syncBtnText}>🔄 Trigger Manual Sync Now</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.lastSyncText}>Last successful sync: {lastSyncedTime}</Text>
      </View>

      {/* Queue Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Local Mutation Log ({queue.length})</Text>
      </View>

      {/* Queue List */}
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.queueCard}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{item.type.toUpperCase()}</Text>
            </View>
            <View style={styles.queueDetails}>
              <Text style={styles.queueDesc}>{item.description}</Text>
              <Text style={styles.queueTime}>{item.timestamp}</Text>
            </View>
            <View style={[styles.statusPill, item.status === "synced" ? styles.pillSynced : styles.pillPending]}>
              <Text style={[styles.statusPillText, item.status === "synced" ? styles.textSynced : styles.textPending]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  header: { backgroundColor: "#4f46e5", padding: 16 },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  statusCard: { backgroundColor: "#111827", margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#1f2937" },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  statusCount: { color: "#ffffff", fontSize: 28, fontWeight: "bold" },
  statusLabel: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  badgeBox: { backgroundColor: "rgba(239, 68, 68, 0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeBoxText: { color: "#ef4444", fontSize: 10, fontWeight: "bold" },
  syncBtn: { backgroundColor: "#10b981", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  syncBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "bold" },
  lastSyncText: { color: "#6b7280", fontSize: 11, textAlign: "center", marginTop: 10 },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { color: "#9ca3af", fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  queueCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111827", marginHorizontal: 12, marginVertical: 4, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#1f2937" },
  typeTag: { backgroundColor: "rgba(99, 102, 241, 0.2)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginRight: 10 },
  typeTagText: { color: "#6366f1", fontSize: 9, fontWeight: "bold" },
  queueDetails: { flex: 1 },
  queueDesc: { color: "#f3f4f6", fontSize: 12, fontWeight: "bold" },
  queueTime: { color: "#6b7280", fontSize: 10, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillPending: { backgroundColor: "rgba(245, 158, 11, 0.2)" },
  pillSynced: { backgroundColor: "rgba(16, 185, 129, 0.2)" },
  statusPillText: { fontSize: 9, fontWeight: "bold" },
  textPending: { color: "#f59e0b" },
  textSynced: { color: "#10b981" },
});
