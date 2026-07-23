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
} from "react-native";

interface StudentProfile {
  id: string;
  name: string;
  studentIdNumber: string;
  className: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
}

export default function StudentRosterScreen() {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");

  const [students] = useState<StudentProfile[]>([
    { id: "1", name: "Abena Osei", studentIdNumber: "STU-001", className: "Form 1B", gender: "Female", guardianName: "Kofi Osei", guardianPhone: "0244123456" },
    { id: "2", name: "Akosua Mensah", studentIdNumber: "STU-002", className: "Form 1B", gender: "Female", guardianName: "Ama Mensah", guardianPhone: "0244654321" },
    { id: "3", name: "Albert Owusu", studentIdNumber: "STU-003", className: "Form 2A", gender: "Male", guardianName: "Kwaku Owusu", guardianPhone: "0208112233" },
    { id: "4", name: "Kwame Kwarteng", studentIdNumber: "STU-004", className: "Form 2A", gender: "Male", guardianName: "Yaa Kwarteng", guardianPhone: "0559887766" },
    { id: "5", name: "Yaa Asantewaa", studentIdNumber: "STU-005", className: "Form 3B", gender: "Female", guardianName: "Osei Asantewaa", guardianPhone: "0277334455" },
  ]);

  const classes = ["All", "Form 1B", "Form 2A", "Form 3B"];

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.studentIdNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "All" || s.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Directory</Text>
        <Text style={styles.headerSubtitle}>{filteredStudents.length} Students Cached Offline</Text>
      </View>

      {/* Class Filter Chips */}
      <View style={styles.chipsRow}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls}
            style={[styles.chip, selectedClass === cls && styles.activeChip]}
            onPress={() => setSelectedClass(cls)}
          >
            <Text style={[styles.chipText, selectedClass === cls && styles.activeChipText]}>{cls}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search name, ID or guardian..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Roster List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.studentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPill}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentId}>{item.studentIdNumber} • {item.gender}</Text>
              </View>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{item.className}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Guardian:</Text>
                <Text style={styles.infoValue}>{item.guardianName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoValue}>{item.guardianPhone}</Text>
              </View>
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
  chipsRow: { flexDirection: "row", gap: 8, padding: 10, backgroundColor: "#111827" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#1f2937" },
  activeChip: { backgroundColor: "#6366f1" },
  chipText: { color: "#9ca3af", fontSize: 12, fontWeight: "bold" },
  activeChipText: { color: "#ffffff" },
  searchContainer: { paddingHorizontal: 10, paddingBottom: 10, backgroundColor: "#111827" },
  searchInput: { backgroundColor: "#1f2937", color: "#ffffff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  studentCard: { backgroundColor: "#111827", marginHorizontal: 10, marginVertical: 5, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#1f2937" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatarPill: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(99, 102, 241, 0.2)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { color: "#6366f1", fontWeight: "bold", fontSize: 16 },
  cardTitleBox: { flex: 1 },
  studentName: { color: "#f3f4f6", fontSize: 14, fontWeight: "bold" },
  studentId: { color: "#9ca3af", fontSize: 11, marginTop: 1 },
  classBadge: { backgroundColor: "rgba(16, 185, 129, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  classBadgeText: { color: "#10b981", fontSize: 11, fontWeight: "bold" },
  cardBody: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: "#1f2937", gap: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { color: "#6b7280", fontSize: 11 },
  infoValue: { color: "#d1d5db", fontSize: 11, fontWeight: "600" },
});
