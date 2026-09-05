import React from "react";
import { View, Text } from "react-native";
import { HighlightedText } from "../HighlightedText";

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  todo: { bg: "#F1F5F9", text: "#64748B", label: "To Do" },
  inprogress: { bg: "#C5D5E4", text: "#1E293B", label: "In Progress" },
  done: { bg: "#DCFCE7", text: "#16A34A", label: "Done" },
};

const PRIORITY_CFG: Record<string, { bg: string; text: string }> = {
  High: { bg: "#FEE2E2", text: "#DC2626" },
  Med: { bg: "#FEF3C7", text: "#D97706" },
  Low: { bg: "#DCFCE7", text: "#16A34A" },
};

export const TaskCardItem = ({ task, query, usersMap, projectMap, getInitials, getMemberColor, styles }: any) => {
  const statusKey = task.status || "todo";
  const priorityKey = task.priority || "Med";
  const s = STATUS_CFG[statusKey] || STATUS_CFG.todo;
  const pr = PRIORITY_CFG[priorityKey] || PRIORITY_CFG.Med;
  const assigneeName = usersMap[task.assigneeId]?.fullName;
  const projectName = projectMap.get(task.projectId) || "Project";

  return (
    <View style={styles.taskCard}>
      <View style={[styles.taskAvatar, { backgroundColor: getMemberColor(task.assigneeId) }]}>
        <Text style={styles.avatarText}>{getInitials(assigneeName)}</Text>
      </View>
      <View style={styles.taskDetails}>
        <HighlightedText text={task.title} query={query} style={styles.taskTitle} highlightStyle={{ backgroundColor: "#FEF08A", color: "#1E293B" }} />
        <View style={styles.taskBadges}>
          <Text style={styles.taskProjectText}>{projectName}</Text>
          <View style={[styles.badge, { backgroundColor: pr.bg }]}>
            <Text style={[styles.badgeText, { color: pr.text }]}>{priorityKey}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};