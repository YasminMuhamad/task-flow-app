import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  projectName: string;
  onBack?: () => void;
  onOpenEdit: () => void;
  onOpenArchive: () => void;
}

export function TaskHeader({ projectName, onBack, onOpenEdit, onOpenArchive }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.primary }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path d="M10 4L6 8l4 4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <Text style={styles.headerTitle} numberOfLines={1}>
        {projectName}
      </Text>

      <TouchableOpacity style={styles.iconBtn} onPress={onOpenEdit}>
        <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <Path d="M10.5 2.5L12.5 4.5M2 13l2.5-.5L12.5 4.5 10.5 2.5 2.5 10.5 2 13z" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={onOpenArchive}>
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path d="M14 5v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5M1 2h14v3H1V2zM6 8h4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});