import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from "react-native";
import AttendanceScreen from "../screens/AttendanceScreen";
import ScoreEntryScreen from "../screens/ScoreEntryScreen";
import StudentRosterScreen from "../screens/StudentRosterScreen";
import SyncCenterScreen from "../screens/SyncCenterScreen";

type TabName = "attendance" | "scores" | "roster" | "sync";

export default function AppNavigator() {
  const [activeTab, setActiveTab] = useState<TabName>("attendance");

  const renderScreen = () => {
    switch (activeTab) {
      case "attendance":
        return <AttendanceScreen />;
      case "scores":
        return <ScoreEntryScreen />;
      case "roster":
        return <StudentRosterScreen />;
      case "sync":
        return <SyncCenterScreen />;
      default:
        return <AttendanceScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("attendance")}
        >
          <Text style={[styles.tabIcon, activeTab === "attendance" && styles.activeTabIcon]}>📋</Text>
          <Text style={[styles.tabLabel, activeTab === "attendance" && styles.activeTabLabel]}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("scores")}
        >
          <Text style={[styles.tabIcon, activeTab === "scores" && styles.activeTabIcon]}>📝</Text>
          <Text style={[styles.tabLabel, activeTab === "scores" && styles.activeTabLabel]}>Scores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("roster")}
        >
          <Text style={[styles.tabIcon, activeTab === "roster" && styles.activeTabIcon]}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === "roster" && styles.activeTabLabel]}>Roster</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("sync")}
        >
          <Text style={[styles.tabIcon, activeTab === "sync" && styles.activeTabIcon]}>🔄</Text>
          <Text style={[styles.tabLabel, activeTab === "sync" && styles.activeTabLabel]}>Sync</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderColor: "#1f2937",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  activeTabIcon: { opacity: 1 },
  tabLabel: { color: "#9ca3af", fontSize: 10, marginTop: 2, fontWeight: "600" },
  activeTabLabel: { color: "#6366f1", fontWeight: "bold" },
});
