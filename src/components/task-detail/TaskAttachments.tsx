import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { TaskAttachment } from "../../types/task";
import { getAttachmentConfig } from "../../utils/taskHelpers";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  attachments: TaskAttachment[];
  uploadingFile: boolean;
  onUpload: () => void;
}

export function TaskAttachments({ attachments, uploadingFile, onUpload }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionPadding}>
      <View style={styles.rowBetween}>
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ATTACHMENTS</Text>
        <TouchableOpacity onPress={onUpload} disabled={uploadingFile}>
          {uploadingFile ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.uploadBtnText, { color: colors.primary }]}>+ Upload</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.attachmentsGrid}>
        {attachments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No attachments added yet</Text>
        ) : (
          attachments.map((f) => {
            const { icon, color } = getAttachmentConfig(f.type, f.name);
            return (
              <View key={f.id} style={[styles.attachmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.fileIconBox, { backgroundColor: color }]}>
                  <Text style={{ fontSize: 16 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{f.name}</Text>
                  <Text style={[styles.fileMeta, { color: colors.textMuted }]}>{f.type} · {f.size}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
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
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  emptyText: { fontSize: 12, fontStyle: "italic" },
  uploadBtnText: { fontSize: 12, fontWeight: "600" },
  attachmentsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attachmentCard: {
    width: "48%",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 12, fontWeight: "600" },
  fileMeta: { fontSize: 10 },
});