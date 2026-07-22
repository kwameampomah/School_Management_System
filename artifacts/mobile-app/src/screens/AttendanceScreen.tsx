import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";

interface StudentItem {
  id: string;
  name: string;
  studentIdNumber: string;
  status: "present" | "absent";
  marked: boolean;
}

export default function AttendanceScreen() {
  const [isOnline] = useState(false); // Simulated offline status
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [students, setStudents] = useState<StudentItem[]>([
    { id: "1", name: "Abena Osei", studentIdNumber: "STU-001", status: "present", marked: true },
    { id: "2", name: "Akosua Mensah", studentIdNumber: "STU-002", status: "present", marked: true },
    { id: "3", name: "Albert Owusu", studentIdNumber: "STU-003", status: "absent", marked: true },
    { id: "4", name: "Kwame Kwarteng", studentIdNumber: "STU-004", status: "present", marked: false },
    { id: "5", name: "Yaa Asantewaa", studentIdNumber: "STU-005", status: "present", marked: false },
  ]);

  const markedCount = students.filter((s) => s.marked).length;
  const progressPercent = Math.round((markedCount / students.length) * 100);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentIdNumber.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string, newStatus: "present" | "absent") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, marked: true, status: newStatus } : s))
    );
  };

  const markAll = (status: "present" | "absent") => {
    setStudents((prev) => prev.map((s) => ({ ...s, marked: true, status })));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Attendance Saved to Local SQLite DB & Queued for Sync!");
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Offline Status Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            🔴 OFFLINE MODE — Saved locally to SQLite & Queued
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Text style={styles.headerSubtitle}>Form 1B • Mathematics • Term 1</Text>
      </View>

      {/* Progress Ring Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>
            Marked: <Text style={styles.boldText}>{markedCount}</Text> / {students.length}
          </Text>
          <Text style={styles.progressPercentText}>{progressPercent}% Complete</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Find student name or ID..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.studentRow,
              item.marked && (item.status === "absent" ? styles.rowAbsent : styles.rowPresent),
            ]}
            onPress={() => toggleStatus(item.id, item.status === "absent" ? "present" : "absent")}
          >
            <Text style={styles.indexText}>{index + 1}</Text>
            <View style={styles.checkbox}>
              {item.marked && (
                <Text style={styles.checkmark}>{item.status === "absent" ? "✕" : "✓"}</Text>
              )}
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentId}>{item.studentIdNumber}</Text>
            </View>
            {item.marked && (
              <View
                style={[
                  styles.badge,
                  item.status === "absent" ? styles.badgeAbsent : styles.badgePresent,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.status === "absent" ? styles.badgeTextAbsent : styles.badgeTextPresent,
                  ]}
                >
                  {item.status === "absent" ? "ABSENT" : "PRESENT"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Bottom Action Bar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => markAll("present")}>
          <Text style={styles.btnSecondaryText}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => markAll("absent")}>
          <Text style={styles.btnSecondaryText}>All Absent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Save & Sync</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  offlineBanner: { backgroundColor: "#ef4444", paddingVertical: 6, paddingHorizontal: 12 },
  offlineBannerText: { color: "#ffffff", fontSize: 11, fontWeight: "bold", textAlign: "center" },
  header: { backgroundColor: "#4f46e5", padding: 16 },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  progressContainer: { backgroundColor: "#111827", padding: 12, borderBottomWidth: 1, borderColor: "#1f2937" },
  progressTextRow: { flexDirection: "row", justifyContext: "space-between", marginBottom: 6 },
  progressText: { color: "#9ca3af", fontSize: 12 },
  boldText: { color: "#6366f1", fontWeight: "bold" },
  progressPercentText: { color: "#10b981", fontSize: 12, fontWeight: "bold" },
  progressBarTrack: { height: 8, backgroundColor: "#1f2937", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#10b981", borderRadius: 4 },
  searchContainer: { padding: 10, backgroundColor: "#111827" },
  searchInput: { backgroundColor: "#1f2937", color: "#ffffff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  studentRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: "#1f2937", backgroundColor: "#111827" },
  rowPresent: { backgroundColor: "rgba(16, 185, 129, 0.08)" },
  rowAbsent: { backgroundColor: "rgba(239, 68, 68, 0.08)" },
  indexText: { color: "#6b7280", fontSize: 12, width: 24 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: "#4b5563", alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkmark: { color: "#10b981", fontWeight: "bold", fontSize: 14 },
  studentDetails: { flex: 1 },
  studentName: { color: "#f3f4f6", fontSize: 14, fontWeight: "bold" },
  studentId: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgePresent: { backgroundColor: "rgba(16, 185, 129, 0.2)" },
  badgeAbsent: { backgroundColor: "rgba(239, 68, 68, 0.2)" },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  badgeTextPresent: { color: "#10b981" },
  badgeTextAbsent: { color: "#ef4444" },
  footer: { flexDirection: "row", padding: 12, backgroundColor: "#111827", borderTopWidth: 1, borderColor: "#1f2937", gap: 8 },
  btnSecondary: { flex: 1, backgroundColor: "#1f2937", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnSecondaryText: { color: "#d1d5db", fontSize: 12, fontWeight: "bold" },
  btnPrimary: { flex: 1, backgroundColor: "#10b981", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnPrimaryText: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
});
