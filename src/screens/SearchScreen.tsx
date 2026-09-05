import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAppContext } from "../context/AppContext";
import { getMillis } from "../utils/date";
import EmptyStateScreen from "../components/EmptyStateScreen";
import { useTheme } from "../context/ThemeContext";

// استيراد المكونات المنفصلة
import { SearchHeader } from "../components/search/SearchHeader";
import { RecentSearches } from "../components/search/RecentSearches";
import { ProjectCardItem } from "../components/search/ProjectCardItem";
import { TaskCardItem } from "../components/search/TaskCardItem";
import { FileCardItem } from "../components/search/FileCardItem";

interface SearchScreenProps {
  onBack: () => void;
}

type FilterTab = "all" | "tasks" | "projects" | "files";
const RECENT_SEARCHES_KEY = "@recent_searches";
const PREVIEW_LIMIT = 3;

export default function SearchScreen({ onBack }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { userProjects, allProjectTasks, allAttachments, usersMap, getInitials, getMemberColor } = useAppContext();

  const hasQuery = query.trim().length > 0;
  const cleanQuery = query.toLowerCase().trim();

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      console.error("Error loading recent searches", e);
    }
  };

  const saveRecentSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 5);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Error saving recent search", e);
    }
  }, []);

  const removeRecentSearch = useCallback(async (text: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== text);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllRecent = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Filtering Memos...
  const filteredProjects = useMemo(() => {
    let list = userProjects;
    if (hasQuery) {
      list = userProjects.filter((p) => p.title?.toLowerCase().includes(cleanQuery) || p.tag?.toLowerCase().includes(cleanQuery));
    }
    return [...list].sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  }, [userProjects, cleanQuery, hasQuery]);

  const filteredTasks = useMemo(() => {
    let list = allProjectTasks;
    if (hasQuery) {
      list = allProjectTasks.filter((t) => t.title?.toLowerCase().includes(cleanQuery));
    }
    return [...list].sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  }, [allProjectTasks, cleanQuery, hasQuery]);

  const filteredFiles = useMemo(() => {
    let list = hasQuery ? allAttachments.filter((f) => f.name?.toLowerCase().includes(cleanQuery) || f.type?.toLowerCase().includes(cleanQuery)) : allAttachments;
    return [...list].sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  }, [allAttachments, cleanQuery, hasQuery]);

  const taskTitleMap = useMemo(() => new Map(allProjectTasks.map((t) => [t.id, t.title])), [allProjectTasks]);
  const projectMap = useMemo(() => new Map(userProjects.map((p) => [p.id, p.title])), [userProjects]);

  const displayedProjects = filter === "all" ? filteredProjects.slice(0, PREVIEW_LIMIT) : filteredProjects;
  const displayedTasks = filter === "all" ? filteredTasks.slice(0, PREVIEW_LIMIT) : filteredTasks;
  const displayedFiles = filter === "all" ? filteredFiles.slice(0, PREVIEW_LIMIT) : filteredFiles;

  const showProjects = (filter === "all" || filter === "projects") && filteredProjects.length > 0;
  const showTasks = (filter === "all" || filter === "tasks") && filteredTasks.length > 0;
  const showFiles = (filter === "all" || filter === "files") && filteredFiles.length > 0;
  const hasResults = showProjects || showTasks || showFiles;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <SearchHeader
        query={query}
        setQuery={setQuery}
        onBack={onBack}
        onSubmit={() => saveRecentSearch(query)}
        filter={filter}
        setFilter={setFilter}
        colors={colors}
        styles={styles}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!hasQuery && (
          <RecentSearches
            searches={recentSearches}
            onSelect={(item) => { setQuery(item); saveRecentSearch(item); }}
            onRemove={removeRecentSearch}
            onClearAll={clearAllRecent}
            styles={styles}
            colors={colors}
          />
        )}

        {hasQuery && !hasResults && (
          <View style={styles.emptyContainer}>
            <EmptyStateScreen variant="tasks" title="No Results Found" subtitle={`No matching ${filter === "all" ? "items" : filter} for "${query}"`} />
          </View>
        )}

        {/* Projects Section */}
        {showProjects && (
          <View style={styles.section}>
            <SectionHeader title="Projects" showSeeAll={filter === "all" && filteredProjects.length > PREVIEW_LIMIT} onSeeAll={() => setFilter("projects")} count={filteredProjects.length} styles={styles} />
            {displayedProjects.map((p) => (
              <ProjectCardItem key={p.id} project={p} query={query} usersMap={usersMap} getInitials={getInitials} getMemberColor={getMemberColor} styles={styles} />
            ))}
          </View>
        )}

        {/* Tasks Section */}
        {showTasks && (
          <View style={styles.section}>
            <SectionHeader title="Tasks" showSeeAll={filter === "all" && filteredTasks.length > PREVIEW_LIMIT} onSeeAll={() => setFilter("tasks")} count={filteredTasks.length} styles={styles} />
            {displayedTasks.map((t) => (
              <TaskCardItem key={t.id} task={t} query={query} usersMap={usersMap} projectMap={projectMap} getInitials={getInitials} getMemberColor={getMemberColor} styles={styles} />
            ))}
          </View>
        )}

        {/* Files Section */}
        {showFiles && (
          <View style={styles.section}>
            <SectionHeader title="Files" showSeeAll={filter === "all" && filteredFiles.length > PREVIEW_LIMIT} onSeeAll={() => setFilter("files")} count={filteredFiles.length} styles={styles} />
            {displayedFiles.map((file, idx) => (
              <FileCardItem key={file.id || idx} file={file} query={query} taskTitleMap={taskTitleMap} styles={styles} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper local small component for Section Headers
const SectionHeader = ({ title, showSeeAll, onSeeAll, count, styles }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {showSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAllText}>See all ({count})</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Styles object (نفس الـ styles السابقة معتمدة على الـ colors)
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
    clearBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
    filterScrollView: { marginTop: 12 },
    filterContainer: { flexDirection: "row", gap: 8 },
    filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
    filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterPillInactive: { backgroundColor: colors.card, borderColor: colors.border },
    filterText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
    filterTextActive: { color: colors.white },
    filterTextInactive: { color: colors.textMuted },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 16, paddingBottom: 24 },
    recentSection: { marginBottom: 20 },
    clearAllText: { fontSize: 12, fontWeight: "600", color: colors.danger },
    recentWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    recentChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    recentText: { fontSize: 12, fontWeight: "500", color: colors.text },
    emptyContainer: { paddingTop: 30, alignItems: "center", justifyContent: "center" },
    section: { marginBottom: 16 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2, color: colors.textMuted },
    seeAllText: { fontSize: 12, fontWeight: "600", color: colors.primary },
    projectCard: { borderRadius: 16, padding: 14, backgroundColor: colors.secondary, marginBottom: 8 },
    projectHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    projectMeta: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    tagBadge: { backgroundColor: "rgba(86,101,81,0.12)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    tagText: { fontSize: 12, fontWeight: "600", color: colors.primary },
    projectTitle: { fontSize: 14, fontWeight: "700", color: colors.text, flexShrink: 1 },
    progressText: { fontSize: 12, fontWeight: "700", color: colors.primary },
    projectFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    avatarStack: { flexDirection: "row", alignItems: "center" },
    avatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.secondary },
    avatarText: { fontSize: 10, fontWeight: "700", color: colors.white },
    progressBarTrack: { flex: 1, marginLeft: 12, height: 6, borderRadius: 3, backgroundColor: "rgba(86,101,81,0.15)", overflow: "hidden" },
    progressBarFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
    taskCard: {
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 8,
    },
    taskAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    taskDetails: { flex: 1 },
    taskTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 },
    taskBadges: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    taskProjectText: { fontSize: 12, color: colors.textMuted },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: "600" },
    fileCard: {
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 8,
    },
    fileIconBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
    fileIconEmoji: { fontSize: 18 },
    fileDetails: { flex: 1 },
    fileName: { fontSize: 13, fontWeight: "600", color: colors.text },
    fileMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  });