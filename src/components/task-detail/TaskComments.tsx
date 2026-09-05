import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { TaskComment } from "../../types/task";
import { formatTime } from "../../utils/taskHelpers";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  comments: TaskComment[];
  usersMap: Record<string, any>;
  projectMemberIds: string[];
  getInitials: (name?: string) => string;
  getMemberColor: (userId: string) => string; // 1. أضفناها هنا
}

export function TaskComments({ comments, usersMap, projectMemberIds, getInitials, getMemberColor }: Props) {
  const { colors } = useTheme();

  const renderFormattedComment = (text: string) => {
    const memberNames = projectMemberIds
      .map((id) => usersMap[id]?.fullName)
      .filter((v): v is string => !!v);

    const words = text.split(" ");
    return words.map((word, index) => {
      const cleanName = word.startsWith("@") ? word.substring(1) : "";
      const isExactMention = memberNames.includes(cleanName);

      if (
        isExactMention ||
        (word.startsWith("@") && memberNames.some((name) => word.substring(1).includes(name)))
      ) {
        return (
          <Text key={index} style={styles.mentionHighlight}>
            {word}{" "}
          </Text>
        );
      }
      return <Text key={index} style={{ color: colors.text }}>{word} </Text>;
    });
  };

  return (
    <View style={styles.sectionPadding}>
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ACTIVITY ({comments.length})</Text>
      {comments.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No comments yet</Text>
      ) : (
        <ScrollView style={styles.commentsScrollContainer} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
          {comments.map((c) => {
            const author = usersMap[c.authorId];
            return (
              <View key={c.id} style={styles.commentRow}>
                {/* 2. استبدلنا لون الثيم الثابت بدالة getMemberColor حسب معرف الكاتب */}
                <View style={[styles.avatar, { backgroundColor: getMemberColor(c.authorId), marginTop: 4 }]}>
                  <Text style={styles.avatarText}>{getInitials(author?.fullName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentName, { color: colors.text }]}>{author?.fullName || "User"}</Text>
                    <Text style={[styles.commentTime, { color: colors.textMuted }]}>{formatTime(c.createdAt)}</Text>
                  </View>
                  <View style={[styles.commentBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={styles.commentText}>{renderFormattedComment(c.text)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionPadding: { paddingHorizontal: 20, marginBottom: 16 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyText: { fontSize: 12, fontStyle: "italic" },
  commentsScrollContainer: { maxHeight: 280, paddingRight: 4 },
  commentRow: { flexDirection: "row", gap: 10,marginBottom: 12 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  commentName: { fontSize: 12, fontWeight: "700" },
  commentTime: { fontSize: 10 },
  commentBubble: {
    borderWidth: 1.5,
    padding: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentText: { fontSize: 13, lineHeight: 18 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  mentionHighlight: { color: "#3370f5", fontWeight: "700" },
});