import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';
import { Project } from '../types/project';
import { Task, TaskStatus } from '../types/task';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import EmptyStateScreen from '../components/EmptyStateScreen';

import { useProjectDetails, FilterTab } from '../hooks/useProjectDetails';
import { ProjectMenuModal } from '../components/project/ProjectMenuModal';
import { ProjectSettingsModal } from '../components/project/ProjectSettingsModal';

interface Props {
  project: Project;
  onBack: () => void;
  onTaskSelect: (taskId: string) => void;
  onOpenArchived: () => void;
}

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

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const formatDueDate = (dateVal: any) => {
  if (!dateVal) return '';
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (dateVal instanceof Date) {
    return dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return String(dateVal);
};

// --- Task Item Component ---
interface TaskItemProps {
  item: Task;
  usersMap: Record<string, any>;
  getInitials: (name: string) => string;
  onTaskSelect: (taskId: string) => void;
  onToggleStatus: (taskId: string, currentStatus: TaskStatus) => void;
}

const TaskItem = memo(({ item, usersMap, getInitials, onTaskSelect, onToggleStatus }: TaskItemProps) => {
  const { colors, isDark } = useTheme();
  const status = item.status || 'todo';
  const priority = item.priority || 'Low';
  const pColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;

  const assignee = usersMap[item.assigneeId];
  const assigneeName = assignee?.fullName || 'User';
  const assigneeInitials = getInitials(assigneeName);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onTaskSelect(item.id)}
      style={[
        styles.taskCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        status === 'done' && { backgroundColor: isDark ? '#162032' : '#F1F5F9', opacity: 0.7 },
        status === 'inprogress' && { borderColor: colors.secondary },
      ]}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => onToggleStatus(item.id, status)}
          style={[
            styles.checkbox, 
            { borderColor: colors.textMuted },
            status === 'done' && { borderColor: colors.primary, backgroundColor: colors.primary }
          ]}
          activeOpacity={0.8}
        >
          {status === 'done' && (
            <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <Path d="M2 5l2.5 2.5L8 2.5" stroke={colors.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, { color: colors.text }, status === 'done' && styles.taskTitleDone]}>
            {item.title}
          </Text>

          <View style={styles.taskMetaRow}>
            <View style={styles.metaItem}>
              <View style={[styles.assigneeAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.assigneeAvatarText, { color: colors.white }]}>{assigneeInitials}</Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{assigneeName.split(' ')[0]}</Text>
            </View>

            <Text style={{ color: colors.border }}>·</Text>

            <View style={[styles.dueDateBadge, { backgroundColor: colors.toggleBg }, item.overdue && { backgroundColor: colors.dangerLight }]}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Rect x="1" y="2" width="8" height="7" rx="1.5" stroke={item.overdue ? colors.danger : colors.textMuted} strokeWidth="1" />
                <Path d="M3 1v2M7 1v2M1 4.5h8" stroke={item.overdue ? colors.danger : colors.textMuted} strokeWidth="1" strokeLinecap="round" />
              </Svg>
              <Text style={[styles.metaText, { color: colors.textMuted }, item.overdue && { color: colors.danger }]}>
                {formatDueDate(item.dueDate)}
              </Text>
            </View>

            <View style={[styles.priorityPill, { backgroundColor: pColor.bg }]}>
              <Text style={[styles.priorityText, { color: pColor.text }]}>{priority}</Text>
            </View>

            <TouchableOpacity
              onPress={() => onToggleStatus(item.id, status)}
              style={[
                styles.statusPill,
                { backgroundColor: colors.toggleBg },
                status === 'inprogress' && { backgroundColor: colors.secondary },
                status === 'done' && { backgroundColor: '#DCFCE7' },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusPillText,
                  { color: colors.textMuted },
                  status === 'inprogress' && { color: colors.text },
                  status === 'done' && { color: '#16A34A' },
                ]}
              >
                {STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ProjectDetailScreen({ project: initialProject, onBack, onTaskSelect, onOpenArchived }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const {
    user,
    usersMap,
    getInitials,
    getMemberColor,
    currentProject,
    filter,
    setFilter,
    tasks,
    loadingTasks,
    activeTab,
    setActiveTab,
    modalVisible,
    setModalVisible,
    menuVisible,
    setMenuVisible,
    deleteConfirmVisible,
    setDeleteConfirmVisible,
    isDeleting,
    editTitle,
    setEditTitle,
    editTag,
    setEditTag,
    isUpdating,
    transferOwnershipModalVisible,
    selectedNewOwner,
    setSelectedNewOwner,
    isTransferring,
    leaveAlertVisible,
    setLeaveAlertVisible,
    leaveConfirmVisible,
    setLeaveConfirmVisible,
    isLeaving,
    settingsModalVisible,
    setSettingsModalVisible,
    searchEmail,
    setSearchEmail,
    searching,
    foundUser,
    notFound,
    memberActionLoading,
    memberToDelete,
    setMemberToDelete,
    isStarred,
    isOwner,
    filteredTasks,
    computedProgress,
    toggleStatus,
    handleTransferOwnership,
    handleLeaveProject,
    handleMenuAction,
    handleDeleteProject,
    handleUpdateProject,
    handleAddMember,
    handleConfirmRemoveMember,
  } = useProjectDetails(initialProject, onBack);

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        item={item}
        usersMap={usersMap}
        getInitials={getInitials}
        onTaskSelect={onTaskSelect}
        onToggleStatus={toggleStatus}
      />
    ),
    [usersMap, getInitials, onTaskSelect, toggleStatus]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.8}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M10 4L6 8l4 4" stroke={colors.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.tagText}>{currentProject.tag || 'General'}</Text>
            <Text style={[styles.projectTitle, { color: colors.white }]} numberOfLines={1}>
              {currentProject.title}
            </Text>
          </View>

          <View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)} activeOpacity={0.8}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Circle cx="8" cy="3" r="1.2" fill={colors.white} />
                <Circle cx="8" cy="8" r="1.2" fill={colors.white} />
                <Circle cx="8" cy="13" r="1.2" fill={colors.white} />
              </Svg>
            </TouchableOpacity>

            <ProjectMenuModal
              visible={menuVisible}
              onClose={() => setMenuVisible(false)}
              isStarred={isStarred}
              isOwner={isOwner}
              onMenuAction={(action) => handleMenuAction(action, onOpenArchived)}
              onOpenSettings={() => {
                setMenuVisible(false);
                setSettingsModalVisible(true);
              }}
            />
          </View>
        </View>

        {/* Members + Progress */}
        <View style={styles.headerFooter}>
          <View style={styles.membersRow}>
            {currentProject.memberIds?.slice(0, 4).map((uid, idx) => {
              const memberInfo = usersMap[uid];
              const name = memberInfo?.fullName || 'User';
              const initials = getInitials(name);
              const color = getMemberColor(uid);
              return (
                <View
                  key={uid}
                  style={[
                    styles.avatar,
                    { backgroundColor: color, marginLeft: idx > 0 ? -8 : 0, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.text }]}>{initials}</Text>
                </View>
              );
            })}
            {currentProject.memberIds && currentProject.memberIds.length > 4 && (
              <View style={[styles.avatar, styles.extraAvatar, { borderColor: colors.primary }]}>
                <Text style={[styles.extraAvatarText, { color: colors.white }]}>+{currentProject.memberIds.length - 4}</Text>
              </View>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${computedProgress}%`, backgroundColor: colors.secondary }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.secondary }]}>{computedProgress}%</Text>
          </View>
        </View>
      </View>

     {/* Filter Tabs */}
<View style={styles.filterWrapper}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
    {FILTER_TABS.map((tab) => {
      const count =
        tab.key === 'all'
          ? tasks.filter((t) => !t.archived).length // تعديل ليعرض المهام غير المؤرشفة فقط
          : tasks.filter((t) => !t.archived && t.status === tab.key).length; // استبعاد المؤرشفة من باقي الفلاتر أيضاً

      const isSelected = filter === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setFilter(tab.key)}
          style={[
            styles.tabBtn, 
            { backgroundColor: colors.card, borderColor: colors.border },
            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, { color: colors.textMuted }, isSelected && { color: colors.white }]}>
            {tab.label}
          </Text>
          {/* لو حابب تظهر الـ badge لتبويب 'all' كمان شيل الشرط ده، أو سيبه لو مش عايزه يظهر */}
          {tab.key !== 'all' && (
            <View style={[styles.badge, { backgroundColor: colors.toggleBg }, isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={[styles.badgeText, { color: colors.textMuted }, isSelected && { color: colors.white }]}>
                {count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </ScrollView>
</View>
      {/* Task List (FlatList) */}
      {loadingTasks ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={[styles.taskList, filteredTasks.length === 0 && styles.emptyListContainer]}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            tasks.filter((t) => !t.archived).length === 0 ? (
              <EmptyStateScreen
                variant="tasks"
                onCTA={() => setModalVisible(true)}
              />
            ) : filter !== 'all' ? (
              <EmptyStateScreen
                variant="tasks"
                title={`No ${filter === 'todo' ? 'To Do' : filter === 'inprogress' ? 'In Progress' : 'Done'} Tasks`}
                subtitle="You don't have any tasks in this status right now."
              />
            ) : null
          }
        />
      )}

      {/* Footer / Add Task Button */}
      <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background }]}>
        {filteredTasks.length > 0 && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addTaskBtn, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M8 3v10M3 8h10" stroke={colors.white} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.addTaskBtnText, { color: colors.white }]}>Add New Task</Text>
          </TouchableOpacity>
        )}
      </View>

      <CreateTaskModal
        visible={modalVisible}
        projectId={currentProject.id}
        onClose={() => setModalVisible(false)}
        onTaskCreated={() => setModalVisible(false)}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        currentProject={currentProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editTag={editTag}
        setEditTag={setEditTag}
        isOwner={isOwner}
        user={user}
        usersMap={usersMap}
        selectedNewOwner={selectedNewOwner}
        setSelectedNewOwner={setSelectedNewOwner}
        isTransferring={isTransferring}
        handleTransferOwnership={handleTransferOwnership}
        isUpdating={isUpdating}
        handleUpdateProject={handleUpdateProject}
        searchEmail={searchEmail}
        setSearchEmail={setSearchEmail}
        searching={searching}
        notFound={notFound}
        foundUser={foundUser}
        memberActionLoading={memberActionLoading}
        handleAddMember={handleAddMember}
        setMemberToDelete={setMemberToDelete}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Project"
        message={`Are you sure you want to delete "${currentProject.title}"? All associated tasks will be permanently removed.`}
        confirmText="Delete"
        confirmBtnColor={colors.danger}
        loading={isDeleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
      <ConfirmationModal
        visible={!!memberToDelete}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToDelete?.name || 'this member'} from the project?`}
        confirmText="Remove"
        confirmBtnColor={colors.danger}
        loading={memberActionLoading}
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setMemberToDelete(null)}
      />

      {/* Leave Alert for Owner */}
      <ConfirmationModal
        visible={leaveAlertVisible}
        title="Action Required"
        message="You are the owner of this project. You must transfer ownership to another member before leaving."
        confirmText="Transfer Ownership"
        confirmBtnColor={colors.primary}
        onConfirm={() => {
          setLeaveAlertVisible(false);
          setSettingsModalVisible(true);
        }}
        onCancel={() => setLeaveAlertVisible(false)}
      />

      {/* Leave Confirmation for Regular Member */}
      <ConfirmationModal
        visible={leaveConfirmVisible}
        title="Leave Project"
        message={`Are you sure you want to leave "${currentProject.title}"? You will lose access to all tasks.`}
        confirmText="Leave"
        confirmBtnColor={colors.danger}
        loading={isLeaving}
        onConfirm={handleLeaveProject}
        onCancel={() => setLeaveConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
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
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  extraAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: -8,
  },
  extraAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
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
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  taskCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeAvatarText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 12,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  addTaskBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addTaskBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});