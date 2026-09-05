import React from "react";
import { View, Text } from "react-native";
import { HighlightedText } from "../HighlightedText";
import { getAttachmentConfig } from "../../utils/taskHelpers";

export const FileCardItem = ({ file, query, taskTitleMap, styles }: any) => {
  const taskTitle = file.taskId ? taskTitleMap.get(file.taskId) : undefined;
  const { icon, color } = getAttachmentConfig(file.type, file.name);
  return (
    <View style={styles.fileCard}>
      <View style={[styles.fileIconBadge, { backgroundColor: color }]}>
        <Text style={styles.fileIconEmoji}>{icon}</Text>
      </View>
      <View style={styles.fileDetails}>
        <HighlightedText text={file.name} query={query} style={styles.fileName} highlightStyle={{ backgroundColor: "#FEF08A", color: "#1E293B" }} />
        <Text style={styles.fileMeta}>
          {file.type?.toUpperCase()} · {file.size} {taskTitle ? `· ${taskTitle}` : ""}
        </Text>
      </View>
    </View>
  );
};