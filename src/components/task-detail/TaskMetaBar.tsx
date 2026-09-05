import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Task } from "../../types/task";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  task: Task;
  assignee: any;
  getInitials: (name?: string) => string;
  formatDate: (date: any) => string;
  onCycleStatus: () => void;
  onCyclePriority: () => void;
  getMemberColor: (userId: string) => string; // 1. أضفناها هنا
}

export function TaskMetaBar({ task, assignee, getInitials, formatDate, onCycleStatus, onCyclePriority, getMemberColor }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionPadding}>
      <View style={styles.titleRow}>
        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
        <TouchableOpacity onPress={onCycleStatus} activeOpacity={0.8}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  task.status === "done" ? "#DCFCE7" : task.status === "inprogress" ? colors.secondary : "#FEF08A",
              },
            ]}
          >
            <Text style={[styles.statusText, { color: "#1E293B" }]}>
              {task.status === "inprogress" ? "In Progress" : task.status === "done" ? "Done" : "To Do"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.metaBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.metaItem}>
          {/* 2. استبدلنا اللون الثابت بـ getMemberColor بناءً على uid بتاع الـ assignee */}
          <View style={[styles.avatar, { backgroundColor: assignee?.uid ? getMemberColor(assignee.uid) : colors.primary }]}>
            <Text style={styles.avatarText}>{getInitials(assignee?.fullName)}</Text>
          </View>
          <View>
            <Text style={[styles.metaLabelBold, { color: colors.text }]}>{assignee?.fullName || "Unassigned"}</Text>
            <Text style={[styles.metaSub, { color: colors.textMuted }]}>Assignee</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.metaItem}>
          <View>
            <Text style={[styles.metaLabelBold, { color: colors.text }]}>{formatDate(task.dueDate)}</Text>
            <Text style={[styles.metaSub, { color: colors.textMuted }]}>Due date</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.metaItem} onPress={onCyclePriority} activeOpacity={0.7}>
          <View>
            <Text
              style={[
                styles.metaLabelBold,
                {
                  color: task.priority === "High" ? colors.danger : task.priority === "Med" ? "#D97706" : "#16A34A",
                },
              ]}
            >
              {task.priority}
            </Text>
            <Text style={[styles.metaSub, { color: colors.textMuted }]}>Priority ↻</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionPadding: { paddingHorizontal: 20, marginBottom: 16 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 26,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: "600" },
  metaBar: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  metaItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabelBold: { fontSize: 12, fontWeight: "600" },
  metaSub: { fontSize: 11 },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});