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
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface ScoreItem {
  id: string;
  studentName: string;
  studentIdNumber: string;
  classWork: string; // Max 50
  exam: string;      // Max 50
  totalScore: number;
}

export default function ScoreEntryScreen() {
  const [selectedComponent, setSelectedComponent] = useState<"classWork" | "exam">("classWork");
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [students, setStudents] = useState<ScoreItem[]>([
    { id: "1", studentName: "Abena Osei", studentIdNumber: "STU-001", classWork: "42", exam: "45", totalScore: 87 },
    { id: "2", studentName: "Akosua Mensah", studentIdNumber: "STU-002", classWork: "38", exam: "40", totalScore: 78 },
    { id: "3", studentName: "Albert Owusu", studentIdNumber: "STU-003", classWork: "45", exam: "48", totalScore: 93 },
    { id: "4", studentName: "Kwame Kwarteng", studentIdNumber: "STU-004", classWork: "", exam: "", totalScore: 0 },
    { id: "5", studentName: "Yaa Asantewaa", studentIdNumber: "STU-005", classWork: "", exam: "", totalScore: 0 },
  ]);

  const filteredStudents = students.filter((s) =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentIdNumber.toLowerCase().includes(search.toLowerCase())
  );

  const updateScore = (index: number, field: "classWork" | "exam", val: string) => {
    const num = Math.min(50, Math.max(0, parseInt(val, 10) || 0));
    setStudents((prev) =>
      prev.map((s, i) => {
        if (i === index) {
          const cw = field === "classWork" ? num : parseInt(s.classWork, 10) || 0;
          const ex = field === "exam" ? num : parseInt(s.exam, 10) || 0;
          // Invariant: GES Integer rounding sum
          const total = Math.round(cw) + Math.round(ex);
          return {
            ...s,
            [field]: val === "" ? "" : String(num),
            totalScore: total,
          };
        }
        return s;
      })
    );
  };

  const applyPreset = (presetValue: number) => {
    updateScore(activeStudentIndex, selectedComponent, String(presetValue));
  };

  const handleNextStudent = () => {
    if (activeStudentIndex < students.length - 1) {
      setActiveStudentIndex(activeStudentIndex + 1);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Scores Saved to Local SQLite DB & Queued for Sync!");
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Score Entry Assistant</Text>
        <Text style={styles.headerSubtitle}>Form 1B • Mathematics • Class Work & Exam</Text>
      </View>

      {/* Component Selector Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedComponent === "classWork" && styles.activeTab]}
          onPress={() => setSelectedComponent("classWork")}
        >
          <Text style={[styles.tabText, selectedComponent === "classWork" && styles.activeTabText]}>
            Class Work (50%)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedComponent === "exam" && styles.activeTab]}
          onPress={() => setSelectedComponent("exam")}
        >
          <Text style={[styles.tabText, selectedComponent === "exam" && styles.activeTabText]}>
            Terminal Exam (50%)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Find student..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isActive = index === activeStudentIndex;
          return (
            <TouchableOpacity
              style={[styles.studentRow, isActive && styles.activeRow]}
              onPress={() => setActiveStudentIndex(index)}
            >
              <Text style={styles.indexText}>{index + 1}</Text>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={styles.studentId}>{item.studentIdNumber}</Text>
              </View>

              <View style={styles.scoreInputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CW</Text>
                  <TextInput
                    style={[styles.scoreInput, selectedComponent === "classWork" && styles.highlightInput]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={item.classWork}
                    onChangeText={(val) => updateScore(index, "classWork", val)}
                    onFocus={() => {
                      setSelectedComponent("classWork");
                      setActiveStudentIndex(index);
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EX</Text>
                  <TextInput
                    style={[styles.scoreInput, selectedComponent === "exam" && styles.highlightInput]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={item.exam}
                    onChangeText={(val) => updateScore(index, "exam", val)}
                    onFocus={() => {
                      setSelectedComponent("exam");
                      setActiveStudentIndex(index);
                    }}
                  />
                </View>

                <View style={styles.totalBadge}>
                  <Text style={styles.totalText}>{item.totalScore}</Text>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Mobile Thumb Assistant Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.assistantBar}>
          <Text style={styles.assistantTitle}>
            Fast Presets ({selectedComponent === "classWork" ? "CW" : "EX"}):
          </Text>
          <View style={styles.presetButtonsRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset(50)}>
              <Text style={styles.presetBtnText}>Max (50)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset(25)}>
              <Text style={styles.presetBtnText}>50% (25)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset(0)}>
              <Text style={styles.presetBtnText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextStudent}>
              <Text style={styles.nextBtnText}>Next ⬇️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save & Queue for Sync</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  header: { backgroundColor: "#4f46e5", padding: 16 },
  headerTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  tabContainer: { flexDirection: "row", backgroundColor: "#111827", padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: "#1f2937" },
  tabText: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },
  activeTabText: { color: "#6366f1", fontWeight: "bold" },
  searchContainer: { padding: 10, backgroundColor: "#111827" },
  searchInput: { backgroundColor: "#1f2937", color: "#ffffff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  studentRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderColor: "#1f2937", backgroundColor: "#111827" },
  activeRow: { backgroundColor: "rgba(99, 102, 241, 0.1)", borderLeftWidth: 3, borderLeftColor: "#6366f1" },
  indexText: { color: "#6b7280", fontSize: 12, width: 22 },
  studentDetails: { flex: 1 },
  studentName: { color: "#f3f4f6", fontSize: 13, fontWeight: "bold" },
  studentId: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  scoreInputsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputGroup: { alignItems: "center" },
  inputLabel: { color: "#6b7280", fontSize: 9, fontWeight: "bold", marginBottom: 2 },
  scoreInput: { width: 42, height: 36, backgroundColor: "#1f2937", color: "#ffffff", borderRadius: 6, textAlign: "center", fontWeight: "bold", fontSize: 14, borderWidth: 1, borderColor: "#374151" },
  highlightInput: { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.15)" },
  totalBadge: { backgroundColor: "#10b981", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" },
  totalText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 },
  totalLabel: { color: "rgba(255,255,255,0.8)", fontSize: 8, fontWeight: "bold" },
  assistantBar: { backgroundColor: "#1f2937", padding: 10, borderTopWidth: 1, borderColor: "#374151" },
  assistantTitle: { color: "#9ca3af", fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  presetButtonsRow: { flexDirection: "row", gap: 8 },
  presetBtn: { flex: 1, backgroundColor: "#374151", paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  presetBtnText: { color: "#f3f4f6", fontSize: 11, fontWeight: "bold" },
  nextBtn: { flex: 1, backgroundColor: "#6366f1", paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  nextBtnText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  footer: { padding: 12, backgroundColor: "#111827", borderTopWidth: 1, borderColor: "#1f2937" },
  saveBtn: { backgroundColor: "#10b981", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  saveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "bold" },
});
