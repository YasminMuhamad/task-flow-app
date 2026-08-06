import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { COLORS } from '../constants/theme';
import { Project } from '../types/project';
import { Task, TaskStatus } from '../types/task';
import { CreateTaskModal } from '../components/CreateTaskModal';

interface Props {
  project: Project;
  onBack: () => void;
  onCreateTask?: () => void;
}

type FilterTab = 'all' | 'todo' | 'inprogress' | 'done';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  High: { bg: '#FEE2E2', text: '#DC2626' },
  Med: { bg: '#FEF3C7', text: '#D97706' },
  Low: { bg: '#DCFCE7', text: '#16A34A' },
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
};

const getMemberColor = (str: string) => {
  const colors = ['#8DA68A', '#C5D5E4', '#A8BECE', '#3F4B3C', '#566551'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function ProjectDetailScreen({ project, onBack, onCreateTask }: Props) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  
  const [membersMap, setMembersMap] = useState<Record<string, { initials: string; name: string }>>({});

  useEffect(() => {
    const fetchMembersInfo = async () => {
      if (!project.memberIds || project.memberIds.length === 0) return;

      const map: Record<string, { initials: string; name: string }> = {};
      for (const uid of project.memberIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            map[uid] = {
              initials: getInitials(data.fullName || 'User'),
              name: data.fullName || 'User',
            };
          } else {
            map[uid] = { initials: 'U', name: 'User' };
          }
        } catch {
          map[uid] = { initials: 'U', name: 'User' };
        }
      }
      setMembersMap(map);
    };

    fetchMembersInfo();
  }, [project.memberIds]);

  useEffect(() => {
    setLoadingTasks(true);
    const q = query(collection(db, 'tasks'), where('projectId', '==', project.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Task, 'id'>),
      }));
      setTasks(fetchedTasks);
      setLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const toggleStatus = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus =
      currentStatus === 'todo'
        ? 'inprogress'
        : currentStatus === 'inprogress'
        ? 'done'
        : 'todo';

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: nextStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const formatDueDate = (dateVal: any) => {
    if (!dateVal) return '';
    if (typeof dateVal.toDate === 'function') {
      const d = dateVal.toDate();
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (dateVal instanceof Date) {
      return dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return String(dateVal);
  };

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const computedProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : project.progress || 0;

  const handleOpenModal = () => {
    if (onCreateTask) onCreateTask();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.8}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M10 4L6 8l4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.tagText}>{project.tag || 'General'}</Text>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {project.title}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Circle cx="8" cy="3" r="1.2" fill="#fff" />
              <Circle cx="8" cy="8" r="1.2" fill="#fff" />
              <Circle cx="8" cy="13" r="1.2" fill="#fff" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Members + Progress */}
        <View style={styles.headerFooter}>
          <View style={styles.membersRow}>
            {project.memberIds?.slice(0, 4).map((uid, idx) => {
              const memberInfo = membersMap[uid] || { initials: 'U', name: 'User' };
              const color = getMemberColor(uid);
              return (
                <View
                  key={uid}
                  style={[
                    styles.avatar,
                    { backgroundColor: color, marginLeft: idx > 0 ? -8 : 0 },
                  ]}
                >
                  <Text style={styles.avatarText}>{memberInfo.initials}</Text>
                </View>
              );
            })}
            {project.memberIds?.length > 4 && (
              <View style={[styles.avatar, styles.extraAvatar]}>
                <Text style={styles.extraAvatarText}>+{project.memberIds.length - 4}</Text>
              </View>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${computedProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{computedProgress}%</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {([
            { key: 'all', label: 'All' },
            { key: 'todo', label: 'To Do' },
            { key: 'inprogress', label: 'In Progress' },
            { key: 'done', label: 'Done' },
          ] as const).map((tab) => {
            const count =
              tab.key === 'all'
                ? tasks.length
                : tasks.filter((t) => t.status === tab.key).length;

            const isSelected = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[
                  styles.tabBtn,
                  isSelected ? styles.tabBtnActive : styles.tabBtnInactive,
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabLabel, isSelected ? styles.tabLabelActive : styles.tabLabelInactive]}>
                  {tab.label}
                </Text>
                {tab.key !== 'all' && (
                  <View style={[styles.badge, isSelected ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, isSelected ? styles.badgeTextActive : styles.badgeTextInactive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      {loadingTasks ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks found in this section.</Text>
          ) : (
            filteredTasks.map((task) => {
              const status = task.status || 'todo';
              const priority = task.priority || 'Low';
              const pColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
              const assigneeInfo = membersMap[task.assigneeId] || { initials: 'U', name: 'User' };
              const assigneeFirstName = assigneeInfo.name.split(' ')[0];

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    status === 'done' && styles.taskCardDone,
                    status === 'inprogress' && styles.taskCardInprogress,
                  ]}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Checkbox Button */}
                    <TouchableOpacity
                      onPress={() => toggleStatus(task.id, status)}
                      style={[
                        styles.checkbox,
                        status === 'done' && styles.checkboxDone,
                      ]}
                      activeOpacity={0.8}
                    >
                      {status === 'done' && (
                        <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <Path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </TouchableOpacity>

                    {/* Task Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.taskTitle,
                          status === 'done' && styles.taskTitleDone,
                        ]}
                      >
                        {task.title}
                      </Text>

                      <View style={styles.taskMetaRow}>
                        {/* Assignee */}
                        <View style={styles.metaItem}>
                          <View style={styles.assigneeAvatar}>
                            <Text style={styles.assigneeAvatarText}>{assigneeInfo.initials}</Text>
                          </View>
                          <Text style={styles.metaText}>{assigneeFirstName}</Text>
                        </View>

                        <Text style={{ color: '#CBD5E1' }}>·</Text>

                        {/* Due Date */}
                        <View
                          style={[
                            styles.dueDateBadge,
                            task.overdue && { backgroundColor: '#FEE2E2' },
                          ]}
                        >
                          <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <Rect x="1" y="2" width="8" height="7" rx="1.5" stroke={task.overdue ? '#DC2626' : '#94A3B8'} strokeWidth="1" />
                            <Path d="M3 1v2M7 1v2M1 4.5h8" stroke={task.overdue ? '#DC2626' : '#94A3B8'} strokeWidth="1" strokeLinecap="round" />
                          </Svg>
                          <Text style={[styles.metaText, task.overdue && { color: '#DC2626' }]}>
                            {formatDueDate(task.dueDate)}
                          </Text>
                        </View>

                        {/* Priority */}
                        <View style={[styles.priorityPill, { backgroundColor: pColor.bg }]}>
                          <Text style={[styles.priorityText, { color: pColor.text }]}>
                            {priority}
                          </Text>
                        </View>

                        {/* Status Toggle Pill */}
                        <TouchableOpacity
                          onPress={() => toggleStatus(task.id, status)}
                          style={[
                            styles.statusPill,
                            status === 'inprogress' && { backgroundColor: '#C5D5E4' },
                            status === 'done' && { backgroundColor: '#DCFCE7' },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              status === 'inprogress' && { color: '#1E293B' },
                              status === 'done' && { color: '#16A34A' },
                            ]}
                          >
                            {STATUS_LABELS[status]}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Footer / Add Task Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity onPress={handleOpenModal} style={styles.addTaskBtn} activeOpacity={0.9}>
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.addTaskBtnText}>Add New Task</Text>
        </TouchableOpacity>
      </View>

      <CreateTaskModal
        visible={modalVisible}
        projectId={project.id}
        onClose={() => setModalVisible(false)}
        onTaskCreated={() => {
          setModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: COLORS.primary || '#566551',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#566551',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  extraAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: -8,
  },
  extraAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    height: 6,
    width: 80,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#C5D5E4',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C5D5E4',
  },
  filterWrapper: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary || '#566551',
    borderColor: COLORS.primary || '#566551',
  },
  tabBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  badgeTextInactive: {
    color: '#94A3B8',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 40,
    fontSize: 14,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  taskCardDone: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  taskCardInprogress: {
    borderColor: '#C5D5E4',
    shadowColor: '#C5D5E4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    borderColor: COLORS.primary || '#566551',
    backgroundColor: COLORS.primary || '#566551',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 8,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary || '#566551',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeAvatarText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#F8F9FA',
  },
  addTaskBtn: {
    backgroundColor: COLORS.primary || '#566551',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addTaskBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});