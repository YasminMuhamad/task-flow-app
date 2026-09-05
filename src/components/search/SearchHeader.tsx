import React from "react";
import { View, TextInput, TouchableOpacity, ScrollView, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

interface SearchHeaderProps {
  query: string;
  setQuery: (text: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  filter: string;
  setFilter: (f: any) => void;
  colors: any;
  styles: any;
}

export const SearchHeader = ({
  query,
  setQuery,
  onBack,
  onSubmit,
  filter,
  setFilter,
  colors,
  styles,
}: SearchHeaderProps) => {
  const hasQuery = query.trim().length > 0;

  return (
    <View style={styles.header}>
      <View style={styles.searchBarContainer}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <Path d="M11 5L7 9l4 4" stroke={colors.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks, projects, files..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus
        />

        {hasQuery ? (
          <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
            <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <Path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        ) : (
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Circle cx="7" cy="7" r="5" stroke={colors.textMuted} strokeWidth="1.5" />
            <Path d="M11 11l3 3" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" />
          </Svg>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterContainer}>
        {(["all", "tasks", "projects", "files"] as const).map((f) => {
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
            >
              <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};