import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';

import { useAppContext } from '../context/AppContext'; 
import { Task } from '../types/task';
import { getMillis } from './utils/date';
import EmptyStateScreen from '../components/EmptyStateScreen';
import { HighlightedText } from '../components/HighlightedText';

interface Props {
  onBack: () => void;
}

type FilterTab = 'all' | 'tasks' | 'projects' | 'files';

const RECENT_SEARCHES_KEY = '@recent_searches';
const PREVIEW_LIMIT = 3;

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  todo: { bg: '#F1F5F9', text: '#64748B', label: 'To Do' },
  inprogress: { bg: '#C5D5E4', text: '#1E293B', label: 'In Progress' },
  done: { bg: '#DCFCE7', text: '#16A34A', label: 'Done' },
};

const PRIORITY_CFG: Record<string, { bg: string; text: string }> = {
  High: { bg: '#FEE2E2', text: '#DC2626' },
  Med: { bg: '#FEF3C7', text: '#D97706' },
  Low: { bg: '#DCFCE7', text: '#16A34A' },
};

const getFileIcon = (type?: string) => {
  const fileType = (type || '').toLowerCase();
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) return '🖼️';
  if (fileType.includes('doc') || fileType.includes('txt')) return '📝';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📎';
};

export default function SearchScreen({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { userProjects, allProjectTasks, allAttachments, usersMap, getInitials } = useAppContext();

  const hasQuery = query.trim().length > 0;
  const cleanQuery = query.toLowerCase().trim();

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading recent searches', e);
    }
  };

  const saveRecentSearch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent search', e);
    }
  };

  const removeRecentSearch = async (text: string) => {
    try {
      const updated = recentSearches.filter((item) => item !== text);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error removing recent search', e);
    }
  };

  const clearAllRecent = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Error clearing recent searches', e);
    }
  };

  // 1. Projects
  const filteredProjects = useMemo(() => {
    let list = userProjects;
    if (hasQuery) {
      list = userProjects.filter(
        p => p.title?.toLowerCase().includes(cleanQuery) || p.tag?.toLowerCase().includes(cleanQuery)
      );
    }
    return [...list].sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  }, [userProjects, cleanQuery, hasQuery]);

  // 2. Tasks
  const filteredTasks = useMemo(() => {
    let list = allProjectTasks;
    if (hasQuery) {
      list = allProjectTasks.filter(t => t.title?.toLowerCase().includes(cleanQuery));
    }
    return [...list].sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  }, [allProjectTasks, cleanQuery, hasQuery]);

  // 3. Attachments
  const filteredFiles = useMemo(() => {
    let list = hasQuery
      ? allAttachments.filter(
          (f) =>
            f.name?.toLowerCase().includes(cleanQuery) ||
            f.type?.toLowerCase().includes(cleanQuery)
        )
      : allAttachments;

    return [...list].sort(
      (a, b) => getMillis(b.createdAt) - getMillis(a.createdAt)
    );
  }, [allAttachments, cleanQuery, hasQuery]);

  const taskTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    allProjectTasks.forEach((t) => map.set(t.id, t.title));
    return map;
  }, [allProjectTasks]);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    userProjects.forEach(p => map.set(p.id, p.title));
    return map;
  }, [userProjects]);

  const displayedProjects = filter === 'all' ? filteredProjects.slice(0, PREVIEW_LIMIT) : filteredProjects;
  const displayedTasks = filter === 'all' ? filteredTasks.slice(0, PREVIEW_LIMIT) : filteredTasks;
  const displayedFiles = filter === 'all' ? filteredFiles.slice(0, PREVIEW_LIMIT) : filteredFiles;

  const showProjects = (filter === 'all' || filter === 'projects') && filteredProjects.length > 0;
  const showTasks = (filter === 'all' || filter === 'tasks') && filteredTasks.length > 0;
  const showFiles = (filter === 'all' || filter === 'files') && filteredFiles.length > 0;

  const hasResults = showProjects || showTasks || showFiles;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <Path d="M11 5L7 9l4 4" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, projects, files..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => saveRecentSearch(query)}
            returnKeyType="search"
            autoFocus
          />

          {hasQuery ? (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          ) : (
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Circle cx="7" cy="7" r="5" stroke="#94A3B8" strokeWidth="1.5" />
              <Path d="M11 11l3 3" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterContainer}>
          {(['all', 'tasks', 'projects', 'files'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                  {f === 'all' ? 'All' : f === 'tasks' ? 'Tasks' : f === 'projects' ? 'Projects' : 'Files'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Stream */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {!hasQuery && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearAllRecent}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentWrap}>
              {recentSearches.map((item, idx) => (
                <View key={idx} style={styles.recentChip}>
                  <TouchableOpacity 
                    onPress={() => {
                      setQuery(item);
                      saveRecentSearch(item);
                    }}
                  >
                    <Text style={styles.recentText}>{item}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => removeRecentSearch(item)} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                    <Svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <Path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasQuery && !hasResults && (
          <View style={styles.emptyContainer}>
            <EmptyStateScreen
              variant="tasks"
              title="No Results Found"
              subtitle={`No matching ${filter === 'all' ? 'items' : filter} for "${query}"`}
            />
          </View>
        )}

        {/* Projects Section */}
        {showProjects && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {filter === 'all' && filteredProjects.length > PREVIEW_LIMIT && (
                <TouchableOpacity onPress={() => setFilter('projects')}>
                  <Text style={styles.seeAllText}>See all ({filteredProjects.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedProjects.map((p) => (
              <View key={p.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectMeta}>
                    {!!p.tag && (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{p.tag}</Text>
                      </View>
                    )}
                    <HighlightedText 
  text={p.title} 
  query={query} 
  style={styles.projectTitle}
  highlightStyle={{ backgroundColor: '#FEF08A', color: '#1E293B' }} 
/>
                  </View>
                  <Text style={styles.progressText}>{p.progress || 0}%</Text>
                </View>

                <View style={styles.projectFooter}>
                  <View style={styles.avatarStack}>
                    {(p.memberIds || []).slice(0, 3).map((mId: string, index: number) => {
                      const memberName = usersMap[mId]?.fullName;
                      const initials = getInitials(memberName);
                      return (
                        <View key={mId || index} style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${p.progress || 0}%` }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tasks Section */}
        {showTasks && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              {filter === 'all' && filteredTasks.length > PREVIEW_LIMIT && (
                <TouchableOpacity onPress={() => setFilter('tasks')}>
                  <Text style={styles.seeAllText}>See all ({filteredTasks.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedTasks.map((t: Task) => {
              const statusKey = t.status || 'todo';
              const priorityKey = t.priority || 'Med';
              const s = STATUS_CFG[statusKey] || STATUS_CFG.todo;
              const pr = PRIORITY_CFG[priorityKey] || PRIORITY_CFG.Med;
              const assigneeId = t.assigneeId;
              const assigneeName = usersMap[assigneeId]?.fullName;
              const initials = getInitials(assigneeName);
              const projectName = projectMap.get(t.projectId) || 'Project';

              return (
                <View key={t.id} style={styles.taskCard}>
                  <View style={styles.taskAvatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.taskDetails}>
                    <HighlightedText 
                      text={t.title} 
                      query={query} 
                      style={styles.taskTitle}
                      highlightStyle={{ backgroundColor: '#FEF08A', color: '#1E293B' }} 
                    />
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
            })}
          </View>
        )}

        {/* Files Section */}
        {showFiles && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Files</Text>
              {filter === 'all' && filteredFiles.length > PREVIEW_LIMIT && (
                <TouchableOpacity onPress={() => setFilter('files')}>
                  <Text style={styles.seeAllText}>See all ({filteredFiles.length})</Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedFiles.map((file, idx) => {
              const taskTitle = file.taskId ? taskTitleMap.get(file.taskId) : undefined;
              return (
                <View key={file.id || idx} style={styles.fileCard}>
                  <View style={styles.fileIconBadge}>
                    <Text style={styles.fileIconEmoji}>{getFileIcon(file.type)}</Text>
                  </View>
                  <View style={styles.fileDetails}>
                    <HighlightedText 
  text={file.name} 
  query={query} 
  style={styles.fileName}
  highlightStyle={{ backgroundColor: '#FEF08A', color: '#1E293B' }} 
/>
                    <Text style={styles.fileMeta}>
                      {file.type?.toUpperCase()} · {file.size} {taskTitle ? `· ${taskTitle}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#566551',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScrollView: {
    marginTop: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterPillActive: {
    backgroundColor: '#566551',
    borderColor: '#566551',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  recentSection: {
    marginBottom: 20,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  recentText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
  },
  emptyContainer: {
    paddingTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#94A3B8',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#566551',
  },
  projectCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#C5D5E4',
    marginBottom: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tagBadge: {
    backgroundColor: 'rgba(86,101,81,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#566551',
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flexShrink: 1,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#566551',
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#566551',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C5D5E4',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    flex: 1,
    marginLeft: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(86,101,81,0.15)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#566551',
  },
  taskCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  taskAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#566551',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  taskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  taskProjectText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  fileIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconEmoji: {
    fontSize: 18,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  fileMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});