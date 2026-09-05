import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { ChecklistItem } from "../../types/task";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  checklist: ChecklistItem[];
  doneCount: number;
  pct: number;
  newChecklistItem: string;
  setNewChecklistItem: (text: string) => void;
  onToggleItem: (item: ChecklistItem) => void;
  onAddItem: () => void;
}

export function TaskChecklist({
  checklist,
  doneCount,
  pct,
  newChecklistItem,
  setNewChecklistItem,
  onToggleItem,
  onAddItem,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionPadding}>
      <View style={styles.rowBetween}>
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>CHECKLIST</Text>
        <Text style={[styles.progressText, { color: colors.primary }]}>
          {doneCount}/{checklist.length} — {pct}%
        </Text>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
      </View>

      {checklist.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.checkCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            item.done && { opacity: 0.7 },
          ]}
          onPress={() => onToggleItem(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, { borderColor: colors.border }, item.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            {item.done && <Text style={styles.checkIcon}>✓</Text>}
          </View>
          <Text style={[styles.checkLabel, { color: colors.text }, item.done && styles.checkLabelDone]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.addItemRow}>
        <TextInput
          placeholder="+ Add checklist item..."
          placeholderTextColor={colors.textMuted}
          style={[styles.addItemInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={newChecklistItem}
          onChangeText={setNewChecklistItem}
          onSubmitEditing={onAddItem}
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={onAddItem}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
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
  progressText: { fontSize: 12, fontWeight: "600" },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  checkCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  checkLabel: { fontSize: 14, flex: 1 },
  checkLabelDone: { textDecorationLine: "line-through", opacity: 0.5 },
  addItemRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  addItemInput: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});