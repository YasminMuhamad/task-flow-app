import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

import { db } from '../api/firebase';
import { COLORS } from '../constants/theme';
import { Project } from '../types/project';
import { Task, TaskStatus } from '../types/task';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useApp } from '../context/AppContext';
import { sendNotification } from '../services/notificationService';
import EmptyStateScreen from '../components/EmptyStateScreen';
import { BlurView } from 'expo-blur';

interface Props {
  project: Project;
  onBack: () => void;
  onTaskSelect: (taskId: string) => void;
  onOpenArchived: () => void;
}

type FilterTab = 'all' | 'todo' | 'inprogress' | 'done';

interface SearchedUser {
  id: string;
  name: string;
  email: string;
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

// --- Extracted Task Item Component for Performance Optimization ---
interface TaskItemProps {
  item: Task;
  usersMap: Record<string, any>;
  getInitials: (name: string) => string;
  onTaskSelect: (taskId: string) => void;
  onToggleStatus: (taskId: string, currentStatus: TaskStatus) => void;
}

const TaskItem = memo(({ item, usersMap, getInitials, onTaskSelect, onToggleStatus }: TaskItemProps) => {
  const status = item.status || 'todo';
  const priority = item.priority || 'Low';
  const pColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;

  const assignee = usersMap[item.assigneeId];
  const assigneeName = assignee?.fullName || 'User';
  const assigneeInitials = getInitials(assigneeName);
  const assigneeFirstName = assigneeName.split(' ')[0];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onTaskSelect(item.id)}
      style={[
        styles.taskCard,
        status === 'done' && styles.taskCardDone,
        status === 'inprogress' && styles.taskCardInprogress,
      ]}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => onToggleStatus(item.id, status)}
          style={[styles.checkbox, status === 'done' && styles.checkboxDone]}
          activeOpacity={0.8}
        >
          {status === 'done' && (
            <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <Path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, status === 'done' && styles.taskTitleDone]}>
            {item.title}
          </Text>

          <View style={styles.taskMetaRow}>
            <View style={styles.metaItem}>
              <View style={styles.assigneeAvatar}>
                <Text style={styles.assigneeAvatarText}>{assigneeInitials}</Text>
              </View>
              <Text style={styles.metaText}>{assigneeFirstName}</Text>
            </View>

            <Text style={{ color: '#CBD5E1' }}>·</Text>

            <View style={[styles.dueDateBadge, item.overdue && { backgroundColor: '#FEE2E2' }]}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Rect x="1" y="2" width="8" height="7" rx="1.5" stroke={item.overdue ? '#DC2626' : '#94A3B8'} strokeWidth="1" />
                <Path d="M3 1v2M7 1v2M1 4.5h8" stroke={item.overdue ? '#DC2626' : '#94A3B8'} strokeWidth="1" strokeLinecap="round" />
              </Svg>
              <Text style={[styles.metaText, item.overdue && { color: '#DC2626' }]}>
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
    </TouchableOpacity>
  );
});

export default function ProjectDetailScreen({ project: initialProject, onBack, onTaskSelect, onOpenArchived }: Props) {
  const insets = useSafeAreaInsets();
  const { user, usersMap, getInitials, getMemberColor } = useApp();

  const [currentProject, setCurrentProject] = useState<Project>(initialProject);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  
  // Modals visibility
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(initialProject.title || '');
  const [editTag, setEditTag] = useState(initialProject.tag || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const [transferOwnershipModalVisible, setTransferOwnershipModalVisible] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [leaveAlertVisible, setLeaveAlertVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Members Management State
  // const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<SearchedUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);

  const isStarred = currentProject.starredBy?.includes(user?.uid || '');

  // Real-time project data
  useEffect(() => {
    const projectRef = doc(db, 'projects', initialProject.id);
    const unsubProject = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedData = { id: docSnap.id, ...docSnap.data() } as Project;
        setCurrentProject(updatedData);
        setEditTitle(updatedData.title);
        setEditTag(updatedData.tag || '');
      }
    });

    return () => unsubProject();
  }, [initialProject.id]);

  // Real-time tasks data
  useEffect(() => {
    setLoadingTasks(true);
    const q = query(collection(db, 'tasks'), where('projectId', '==', currentProject.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks: Task[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Task, 'id'>),
        }));
        setTasks(fetchedTasks);
        setLoadingTasks(false);
      },
      (error) => {
        console.error('Error fetching tasks: ', error);
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [currentProject.id]);

  const filteredTasks = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived);
    if (filter === 'all') return activeTasks;
    return activeTasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const computedProgress = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived);
    const totalCount = activeTasks.length;
    const doneCount = activeTasks.filter((t) => t.status === 'done').length;

    return totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : currentProject.progress || 0;
  }, [tasks, currentProject.progress]);

  const toggleStatus = useCallback(
    async (taskId: string, currentStatus: TaskStatus) => {
      if (!user) return;

      const nextStatus: TaskStatus =
        currentStatus === 'todo'
          ? 'inprogress'
          : currentStatus === 'inprogress'
          ? 'done'
          : 'todo';

      try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, { status: nextStatus });

        const targetTask = tasks.find((t) => t.id === taskId);

        if (
          nextStatus === 'done' &&
          currentStatus !== 'done' &&
          targetTask &&
          currentProject.createdBy &&
          currentProject.createdBy !== user.uid
        ) {
          const assigneeInfo = targetTask.assigneeId ? usersMap[targetTask.assigneeId] : null;
          const assigneeName = assigneeInfo?.fullName || 'A teammate';

          await sendNotification({
            recipientId: currentProject.createdBy,
            senderId: user.uid,
            type: 'task',
            text: `${assigneeName} completed "${targetTask.title}"`,
            projectId: targetTask.projectId,
            taskId: targetTask.id,
          });
        }
      } catch (err) {
        console.error('Error updating task status:', err);
      }
    },
    [tasks, user, usersMap, currentProject.createdBy]
  );

  const isOwner = currentProject.createdBy === user?.uid;
  
  const handleToggleStar = async () => {
    if (!currentProject || !user?.uid) return;

    const projectRef = doc(db, 'projects', currentProject.id);
    const isStarred = currentProject.starredBy?.includes(user.uid);

    try {
      await updateDoc(projectRef, {
        starredBy: isStarred 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner || !user?.uid) return;
    try {
      setIsTransferring(true);
      const projectRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectRef, {
        createdBy: selectedNewOwner,
      });

      const senderName = usersMap[user.uid]?.fullName || 'A project member';
      await sendNotification({
        recipientId: selectedNewOwner,
        senderId: user.uid,
        type: 'project',
        text: `${senderName} transferred the ownership of "${currentProject.title}" to you.`,
        projectId: currentProject.id,
      });

      setIsTransferring(false);
      setTransferOwnershipModalVisible(false);
      setSelectedNewOwner(null);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      setIsTransferring(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!user?.uid) return;
    try {
      setIsLeaving(true);
      const projectRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectRef, {
        memberIds: arrayRemove(user.uid),
      });

      if (currentProject.createdBy && currentProject.createdBy !== user.uid) {
        const leaverName = usersMap[user.uid]?.fullName || 'A member';
        await sendNotification({
          recipientId: currentProject.createdBy,
          senderId: user.uid,
          type: 'project',
          text: `${leaverName} left the project "${currentProject.title}".`,
          projectId: currentProject.id,
        });
      }

      setIsLeaving(false);
      setLeaveConfirmVisible(false);
      onBack();
    } catch (error) {
      console.error('Error leaving project:', error);
      setIsLeaving(false);
    }
  };

const handleMenuAction = (action: string) => {
  setMenuVisible(false);
  switch (action) {
    case 'edit':
      setActiveTab('general');
      setSettingsModalVisible(true);
      break;
    case 'members':
      setActiveTab('members');
      setSettingsModalVisible(true);
      break;
    case 'transfer_ownership':
      setActiveTab('general');
      setSettingsModalVisible(true);
      break;
    case 'leave':
      if (isOwner) {
        setLeaveAlertVisible(true);
      } else {
        setLeaveConfirmVisible(true);
      }
      break;
    case 'delete':
      setDeleteConfirmVisible(true);
      break;
    case 'archived':
      onOpenArchived();
      break;
    case 'starred':
      handleToggleStar();
      break;
  }
};

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', currentProject.id));
      const tasksSnapshot = await getDocs(tasksQuery);
      const deletePromises = tasksSnapshot.docs.map((taskDoc) => deleteDoc(taskDoc.ref));
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, 'projects', currentProject.id));

      setIsDeleting(false);
      setDeleteConfirmVisible(false);
      onBack();
    } catch (error) {
      console.error('Error deleting project:', error);
      setIsDeleting(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editTitle.trim()) return;
    try {
      setIsUpdating(true);
      const projectRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectRef, {
        title: editTitle.trim(),
        tag: editTag.trim() || 'General',
      });

      setIsUpdating(false);
      setSettingsModalVisible(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setIsUpdating(false);
    }
  };

useEffect(() => {
  const trimmed = searchEmail.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmed || !emailRegex.test(trimmed)) {
    setFoundUser(null);
    setNotFound(false);
    setSearching(false);
    return;
  }

  setSearching(true);
  setNotFound(false);

  const timer = setTimeout(async () => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', trimmed));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const data = userDoc.data();
        setFoundUser({
          id: userDoc.id,
          name: data.fullName || 'User',
          email: data.email || trimmed,
        });
      } else {
        setNotFound(true);
        setFoundUser(null);
      }
    } catch (error) {
      console.error('Error searching user:', error);
    } finally {
      setSearching(false);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [searchEmail]);

const handleAddMember = async (userId: string) => {
  if (!user?.uid) return;

  try {
    setMemberActionLoading(true);
    const projectRef = doc(db, 'projects', currentProject.id);
    
    await updateDoc(projectRef, {
      memberIds: arrayUnion(userId),
    });

    const senderName = usersMap[user.uid]?.fullName || 'A team member';
    await sendNotification({
      recipientId: userId,
      senderId: user.uid,
      type: 'project',
      text: `${senderName} added you to the project "${currentProject.title}".`,
      projectId: currentProject.id,
    });

    const projectOwnerId = currentProject.createdBy;
    if (projectOwnerId && projectOwnerId !== user.uid && projectOwnerId !== userId) {
      await sendNotification({
        recipientId: projectOwnerId,
        senderId: user.uid,
        type: 'project',
        text: `${senderName} added ${usersMap[userId]?.fullName || 'a new member'} to "${currentProject.title}".`,
        projectId: currentProject.id,
      });
    }

    setSearchEmail('');
    setFoundUser(null);
    setNotFound(false);
  } catch (error) {
    console.error('Error adding member:', error);
  } finally {
    setMemberActionLoading(false);
  }
};

const handleConfirmRemoveMember = async () => {
  if (!memberToDelete || !user?.uid) return;

  try {
    setMemberActionLoading(true);
    const projectRef = doc(db, 'projects', currentProject.id);

    await updateDoc(projectRef, {
      memberIds: arrayRemove(memberToDelete.id),
    });

    const senderName = usersMap[user.uid]?.fullName || 'The project owner';
    await sendNotification({
      recipientId: memberToDelete.id,
      senderId: user.uid,
      type: 'project',
      text: `${senderName} removed you from the project "${currentProject.title}".`,
      projectId: currentProject.id,
    });
  } catch (error) {
    console.error('Error removing member:', error);
  } finally {
    setMemberActionLoading(false);
    setMemberToDelete(null);
  }
};

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
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.8}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M10 4L6 8l4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.tagText}>{currentProject.tag || 'General'}</Text>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {currentProject.title}
            </Text>
          </View>

          <View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)} activeOpacity={0.8}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Circle cx="8" cy="3" r="1.2" fill="#fff" />
                <Circle cx="8" cy="8" r="1.2" fill="#fff" />
                <Circle cx="8" cy="13" r="1.2" fill="#fff" />
              </Svg>
            </TouchableOpacity>

            <Modal 
  visible={menuVisible} 
  transparent 
  animationType="fade" 
  onRequestClose={() => setMenuVisible(false)}
>
  <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
      <BlurView intensity={25} tint="dark" style={styles.overlay}>
      <View style={styles.menuContainer}>

        {/* 1. Star / Unstar Project */}
        <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('starred')}>
          <View style={styles.menuIconContainer}>
            {isStarred ? (
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path d="M8 1.5l2.12 4.3 4.74.69-3.43 3.35.81 4.73L8 12.34l-4.24 2.23.81-4.73-3.43-3.35 4.74-.69L8 1.5z" fill="#EAB308" stroke="#EAB308" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            ) : (
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path d="M8 1.5l2.12 4.3 4.74.69-3.43 3.35.81 4.73L8 12.34l-4.24 2.23.81-4.73-3.43-3.35 4.74-.69L8 1.5z" stroke="#566551" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            )}
          </View>
          <Text style={styles.menuText}>
            {isStarred ? 'Unstar Project' : 'Star Project'}
          </Text>
        </TouchableOpacity>

        {/* 2. Archived Tasks */}
        <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('archived')}>
          <View style={styles.menuIconContainer}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Rect x="1.5" y="3.5" width="13" height="2.5" rx="1" stroke="#566551" strokeWidth="1.3"/>
              <Path d="M3 6v5.5a1 1 0 001 1h8a1 1 0 001-1V6" stroke="#566551" strokeWidth="1.3" strokeLinecap="round"/>
              <Path d="M6.5 9.5h3" stroke="#566551" strokeWidth="1.3" strokeLinecap="round"/>
            </Svg>
          </View>
          <Text style={styles.menuText}>Archived Tasks</Text>
        </TouchableOpacity>

        {/* 3. Project Settings */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            setMenuVisible(false);
            setSettingsModalVisible(true);
          }}
        >
          <View style={styles.menuIconContainer}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Circle cx="8" cy="8" r="2.2" stroke="#566551" strokeWidth="1.3"/>
              <Path d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5L3.4 3.4" stroke="#566551" strokeWidth="1.3" strokeLinecap="round"/>
            </Svg>
          </View>
          <Text style={styles.menuText}>Project Settings</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        
        {/* 4. Leave Project */}
        <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('leave')}>
          <View style={styles.menuIconContainer}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M6 14.5H3.5a1 1 0 01-1-1v-11a1 1 0 011-1H6M10.5 11.5l3-3.5-3-3.5M6.5 8h7" stroke="#DC2626" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
          <Text style={[styles.menuText, { color: '#DC2626' }]}>Leave Project</Text>
        </TouchableOpacity>

        {/* 5. Delete Project (Owner Only) */}
        {isOwner && (
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('delete')}>
            <View style={styles.menuIconContainer}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path d="M2.5 4.5h11M6 4.5V2.8h4v1.7M6.5 7v4.5M9.5 7v4.5M3.8 4.5l.5 8.5a1 1 0 001 .9h5.4a1 1 0 001-.9l.5-8.5" stroke="#DC2626" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </View>
            <Text style={[styles.menuText, { color: '#DC2626' }]}>Delete Project</Text>
          </TouchableOpacity>
        )}

      </View>
    </BlurView>
  </TouchableWithoutFeedback>
</Modal>
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
                    { backgroundColor: color, marginLeft: idx > 0 ? -8 : 0 },
                  ]}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              );
            })}
            {currentProject.memberIds && currentProject.memberIds.length > 4 && (
              <View style={[styles.avatar, styles.extraAvatar]}>
                <Text style={styles.extraAvatarText}>+{currentProject.memberIds.length - 4}</Text>
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
          {FILTER_TABS.map((tab) => {
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

      {/* Task List (FlatList) */}
      {loadingTasks ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={[
            styles.taskList,
            filteredTasks.length === 0 && styles.emptyListContainer,
          ]}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <EmptyStateScreen
              variant="tasks"
              onCTA={() => setModalVisible(true)}
            />
          }
        />
      )}

      {/* Footer / Add Task Button */}
      <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {filteredTasks.length > 0 && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addTaskBtn} activeOpacity={0.9}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={styles.addTaskBtnText}>Add New Task</Text>
          </TouchableOpacity>
        )}
      </View>

      <CreateTaskModal
        visible={modalVisible}
        projectId={currentProject.id}
        onClose={() => setModalVisible(false)}
        onTaskCreated={() => setModalVisible(false)}
      />

      {/* Project Settings Modal (Merged Edit, Ownership & Members) */}
<Modal
  visible={settingsModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setSettingsModalVisible(false)}
>
  <BlurView intensity={25} tint="dark" style={styles.modalOverlayCenter}>
    <View style={[styles.dialogContainer, { maxHeight: '85%' }]}>
      
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.dialogTitle}>Project Settings</Text>
        <TouchableOpacity 
          onPress={() => setSettingsModalVisible(false)}
          style={styles.closeIconBtn}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Segmented Control / Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'general' && styles.activeTabButton]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'members' && styles.activeTabButton]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members ({currentProject.memberIds?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: General Settings & Transfer Ownership */}
      {activeTab === 'general' ? (
        <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.modalInput}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Project Title"
            placeholderTextColor="#94A3B8"
            editable={isOwner}
          />

          <Text style={styles.inputLabel}>Tag</Text>
          <TextInput
            style={styles.modalInput}
            value={editTag}
            onChangeText={setEditTag}
            placeholder="Tag (e.g., Mobile, Web)"
            placeholderTextColor="#94A3B8"
            editable={isOwner}
          />

          {isOwner && (
            <View style={styles.transferSection}>
              <Text style={styles.dangerZoneTitle}>Transfer Ownership</Text>
              <Text style={styles.dangerZoneSubtext}>
                Select a team member to take full ownership of this project.
              </Text>

              <ScrollView style={styles.ownerPickerList} nestedScrollEnabled>
                {currentProject.memberIds
                  ?.filter((uid) => uid !== user?.uid)
                  .map((uid) => {
                    const info = usersMap[uid];
                    const name = info?.fullName || 'User';
                    const email = info?.email || '';
                    const isSelected = selectedNewOwner === uid;

                    return (
                      <TouchableOpacity
                        key={uid}
                        style={[
                          styles.ownerSelectRow,
                          isSelected && styles.ownerSelectRowActive,
                        ]}
                        onPress={() => setSelectedNewOwner(uid)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.memberName, isSelected && { color: COLORS.primary, fontWeight: '700' }]}>
                            {name}
                          </Text>
                          {email ? <Text style={styles.selectEmail}>{email}</Text> : null}
                        </View>
                        {isSelected && (
                          <View style={styles.radioSelectedDot} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              {selectedNewOwner && (
                <TouchableOpacity
                  style={[styles.dialogBtn, styles.transferBtn]}
                  onPress={handleTransferOwnership}
                  disabled={isTransferring}
                >
                  {isTransferring ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.transferBtnText}>Confirm Transfer to Selected Member</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={[styles.dialogActions, { marginTop: 20 }]}>
            <TouchableOpacity
              style={[styles.dialogBtn, styles.cancelBtn]}
              onPress={() => setSettingsModalVisible(false)}
              disabled={isUpdating}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dialogBtn, styles.saveBtn]}
              onPress={handleUpdateProject}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Tab 2: Manage Members */
        <View style={{ flex: 1, marginTop: 12 }}>
          <Text style={styles.inputLabel}>Search by Email</Text>
          <View style={styles.searchBoxContainer}>
            <TextInput
              style={styles.modalInputSearch}
              value={searchEmail}
              onChangeText={setSearchEmail}
              placeholder="Enter user email..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {searching && <ActivityIndicator size="small" color={COLORS.primary} style={styles.searchSpinner} />}
          </View>

          {notFound && <Text style={styles.notFoundText}>User not found</Text>}

          {foundUser && (
            <View style={styles.selectCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectName}>{foundUser.name}</Text>
                <Text style={styles.selectEmail}>{foundUser.email}</Text>
              </View>
              {currentProject.memberIds?.includes(foundUser.id) ? (
                <Text style={styles.alreadyAddedText}>Already added</Text>
              ) : (
                <TouchableOpacity
                  style={styles.addMemberBtn}
                  onPress={() => handleAddMember(foundUser.id)}
                  disabled={memberActionLoading}
                >
                  {memberActionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addMemberBtnText}>Add</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Project Members</Text>
          <ScrollView style={styles.membersListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {currentProject.memberIds?.map((uid) => {
              const info = usersMap[uid];
              const name = info?.fullName || 'User';
              const email = info?.email || '';
              const isThisMemberOwner = uid === currentProject.createdBy;
              const initials = name.slice(0, 2).toUpperCase();

              return (
                <View key={uid} style={styles.memberCardRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.memberName}>
                      {name} {isThisMemberOwner ? '(Owner)' : ''}
                    </Text>
                    {email ? <Text style={styles.selectEmail}>{email}</Text> : null}
                  </View>

                  {isOwner && !isThisMemberOwner && (
                    <TouchableOpacity
                      onPress={() => setMemberToDelete({ id: uid, name })}
                      style={styles.removeMemberBtn}
                    >
                      <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <Path d="M3 3l8 8M11 3l-8 8" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
                      </Svg>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={[styles.dialogBtn, styles.cancelBtn]}
              onPress={() => {
                setSettingsModalVisible(false);
                setSearchEmail('');
                setFoundUser(null);
                setNotFound(false);
              }}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  </BlurView>
</Modal>
      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Project"
        message={`Are you sure you want to delete "${currentProject.title}"? All associated tasks will be permanently removed.`}
        confirmText="Delete"
        confirmBtnColor="#DC2626"
        loading={isDeleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
      <ConfirmationModal
        visible={!!memberToDelete}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToDelete?.name || 'this member'} from the project?`}
        confirmText="Remove"
        confirmBtnColor="#DC2626"
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
        confirmBtnColor={COLORS.primary}
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
        confirmBtnColor="#DC2626"
        loading={isLeaving}
        onConfirm={handleLeaveProject}
        onCancel={() => setLeaveConfirmVisible(false)}
      />

      {/* Transfer Ownership Modal */}
      {/* <Modal
        visible={transferOwnershipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferOwnershipModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Transfer Ownership</Text>
            <Text style={[styles.inputLabel, { marginBottom: 12 }]}>
              Select a member to become the new project owner:
            </Text>

            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              {currentProject.memberIds
                ?.filter((uid) => uid !== user?.uid)
                .map((uid) => {
                  const info = usersMap[uid];
                  const name = info?.fullName || 'User';
                  const isSelected = selectedNewOwner === uid;

                  return (
                    <TouchableOpacity
                      key={uid}
                      style={[
                        styles.memberRow,
                        isSelected && { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8 },
                      ]}
                      onPress={() => setSelectedNewOwner(uid)}
                    >
                      <Text style={[styles.memberName, isSelected && { color: COLORS.primary, fontWeight: '700' }]}>
                        {name}
                      </Text>
                      {isSelected && (
                        <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Selected</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.cancelBtn]}
                onPress={() => {
                  setTransferOwnershipModalVisible(false);
                  setSelectedNewOwner(null);
                }}
                disabled={isTransferring}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogBtn,
                  styles.saveBtn,
                  !selectedNewOwner && { opacity: 0.5 },
                ]}
                onPress={handleTransferOwnership}
                disabled={!selectedNewOwner || isTransferring}
              >
                {isTransferring ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Transfer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: COLORS.primary || '#566551',
    paddingHorizontal: 20,
    // paddingTop: 12,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 30,
    paddingRight: 30,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 14,
},
menuIconContainer: {
  width: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
menuText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#334155',
},
divider: {
  height: 1,
  backgroundColor: '#E2E8F0',
  marginVertical: 4,
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
    // paddingBottom: 20,
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
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    maxHeight: '85%',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  dialogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.primary || '#566551',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  searchBoxContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  modalInputSearch: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 36,
    fontSize: 14,
    color: '#1E293B',
  },
  searchSpinner: {
    position: 'absolute',
    right: 10,
  },
  notFoundText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  selectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  selectEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  alreadyAddedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  addMemberBtn: {
    backgroundColor: COLORS.primary || '#566551',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMemberBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  membersListScroll: {
    maxHeight: 180,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  memberEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  removeMemberBtn: {
    padding: 6,
  },
  tabContainer: {
  flexDirection: 'row',
  backgroundColor: '#F1F5F9',
  borderRadius: 8,
  padding: 4,
  marginTop: 12,
  marginBottom: 8,
},
tabButton: {
  flex: 1,
  paddingVertical: 8,
  alignItems: 'center',
  borderRadius: 6,
},
activeTabButton: {
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
tabText: {
  fontSize: 14,
  color: '#64748B',
  fontWeight: '500',
},
activeTabText: {
  color: COLORS.primary,
  fontWeight: '600',
},
  // Modal Container
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeIconBtn: {
    padding: 4,
  },
  // Transfer Section Inside General Tab
  transferSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
    marginBottom: 4,
  },
  dangerZoneSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  ownerPickerList: {
    maxHeight: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  ownerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  ownerSelectRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary || '#2563EB',
  },
  radioSelectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary || '#2563EB',
  },
  transferBtn: {
    backgroundColor: '#E11D48',
    marginTop: 10,
  },
  transferBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});