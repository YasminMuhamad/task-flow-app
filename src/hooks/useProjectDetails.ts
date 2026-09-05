import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Project } from '../types/project';
import { Task, TaskStatus } from '../types/task';
import { useApp } from '../context/AppContext';
import { sendNotification } from '../services/notificationService';

export type FilterTab = 'all' | 'todo' | 'inprogress' | 'done';

export interface SearchedUser {
  id: string;
  name: string;
  email: string;
}

export function useProjectDetails(initialProject: Project, onBack: () => void) {
  const { user, usersMap, getInitials, getMemberColor } = useApp();

  const [currentProject, setCurrentProject] = useState<Project>(initialProject);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  
  // Modals visibility states
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<SearchedUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);

  const isStarred = currentProject.starredBy?.includes(user?.uid || '');
  const isOwner = currentProject.createdBy === user?.uid;

  // Real-time project data listener
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

  // Real-time tasks data listener
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
  
  const handleToggleStar = async () => {
    if (!currentProject || !user?.uid) return;

    const projectRef = doc(db, 'projects', currentProject.id);
    const starredState = currentProject.starredBy?.includes(user.uid);

    try {
      await updateDoc(projectRef, {
        starredBy: starredState 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleTransferOwnership = async () => {
    // ضعي هذا السطر في البداية تماماً قبل أي شروط
    console.log("=== TRANSFER CLICKED ===", { 
      selectedNewOwner, 
      userId: user?.uid, 
      projectId: currentProject?.id 
    });

    if (!selectedNewOwner || !user?.uid) {
      console.log("Stopped: Missing selectedNewOwner or user.uid");
      return;
    }

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

  const handleMenuAction = (action: string, onOpenArchived: () => void) => {
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

  return {
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
    setTransferOwnershipModalVisible,
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
    handleToggleStar,
    handleTransferOwnership,
    handleLeaveProject,
    handleMenuAction,
    handleDeleteProject,
    handleUpdateProject,
    handleAddMember,
    handleConfirmRemoveMember,
  };
}