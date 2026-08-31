import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  documentId,
  collectionGroup,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { UserProfile } from '../types/user';
import { Project } from '../types/project';
import { Task, TaskAttachment } from '../types/task';
import { AppNotification } from '../types/notification';

export const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const getMemberColor = (str: string): string => {
  const colors = ['#8DA68A', '#C5D5E4', '#A8BECE', '#3F4B3C', '#566551'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export interface TaskAttachmentWithMeta extends TaskAttachment {
  taskId?: string;
}

interface AppContextType {
  user: User | null;
  profileData: UserProfile | null;
  userInitials: string;
  userProjects: Project[];
  userTasks: Task[];
  allProjectTasks: Task[];
  allAttachments: TaskAttachmentWithMeta[];
  notifications: AppNotification[];
  hasUnreadNotifications: boolean;
  usersMap: Record<string, UserProfile>;
  loading: boolean;
  getInitials: (name?: string) => string;
  getMemberColor: (str: string) => string;
  logout: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useApp = useAppContext;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [allProjectTasks, setAllProjectTasks] = useState<Task[]>([]);
  const [allAttachments, setAllAttachments] = useState<TaskAttachmentWithMeta[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  const userInitials = useMemo(() => {
    return getInitials(profileData?.fullName);
  }, [profileData?.fullName]);

  // 1. Authentication listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfileData(null);
        setUserProjects([]);
        setUserTasks([]);
        setAllProjectTasks([]);
        setAllAttachments([]);
        setNotifications([]);
        setHasUnreadNotifications(false);
        setUsersMap({});
        setLoading(false);
      }
    });

    return unsubAuth;
  }, []);

  // 2. User profile, projects, and assigned user tasks
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData({ uid: user.uid, ...docSnap.data() } as UserProfile);
      }
    });

    const qProjects = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', user.uid)
    );
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setUserProjects(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
    });

    const qUserTasks = query(
      collection(db, 'tasks'),
      where('assigneeId', '==', user.uid)
    );
    const unsubUserTasks = onSnapshot(qUserTasks, (snapshot) => {
      setUserTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubProjects();
      unsubUserTasks();
    };
  }, [user]);

  // 3. Sync all project tasks in chunks (Firestore 'in' query supports up to 30 items)
  useEffect(() => {
    if (!user || userProjects.length === 0) {
      setAllProjectTasks([]);
      return;
    }

    const projectIds = userProjects.map((p) => p.id);
    const chunks: string[][] = [];
    for (let i = 0; i < projectIds.length; i += 30) {
      chunks.push(projectIds.slice(i, i + 30));
    }

    const unsubs = chunks.map((chunk) => {
      const q = query(collection(db, 'tasks'), where('projectId', 'in', chunk));
      return onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task));

        setAllProjectTasks((prev) => {
          const taskMap = new Map(prev.map((t) => [t.id, t]));
          fetchedTasks.forEach((t) => taskMap.set(t.id, t));
          return Array.from(taskMap.values());
        });
      });
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, userProjects]);

  // 4. Subcollection listener: Fetch all task attachments
  useEffect(() => {
    if (!user) {
      setAllAttachments([]);
      return;
    }

    const qAttachments = collectionGroup(db, 'attachments');
    const unsubAttachments = onSnapshot(qAttachments, (snapshot) => {
      const fetchedFiles: TaskAttachmentWithMeta[] = snapshot.docs.map((d) => {
        const parentTaskId = d.ref.parent.parent?.id;
        return {
          id: d.id,
          taskId: parentTaskId,
          ...d.data(),
        } as TaskAttachmentWithMeta;
      });

      setAllAttachments(fetchedFiles);
    });

    return () => unsubAttachments();
  }, [user]);

  // 5. User profiles cache for all project members
  useEffect(() => {
    if (!user || userProjects.length === 0) return;

    const allMemberIds = Array.from(
      new Set(userProjects.flatMap((p) => p.memberIds || []))
    );

    const missingMemberIds = allMemberIds.filter((id) => !usersMap[id]);
    if (missingMemberIds.length === 0) return;

    const chunks: string[][] = [];
    for (let i = 0; i < missingMemberIds.length; i += 30) {
      chunks.push(missingMemberIds.slice(i, i + 30));
    }

    const unsubs = chunks.map((chunk) => {
      const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
      return onSnapshot(q, (snapshot) => {
        const updatedUsers: Record<string, UserProfile> = {};
        snapshot.docs.forEach((docSnap) => {
          updatedUsers[docSnap.id] = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        });
        setUsersMap((prev) => ({ ...prev, ...updatedUsers }));
      });
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, userProjects, usersMap]);

  // 6. Real-time Notifications Listener
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setHasUnreadNotifications(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as AppNotification[];

      notifs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setNotifications(notifs);
      setHasUnreadNotifications(notifs.some((n) => !n.read));
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore update helper: Mark single notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Firestore update helper: Mark all notifications as read using batch writing
  const markAllNotificationsAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.read);
    if (unreadNotifs.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadNotifs.forEach((n) => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  // Firestore helper: Delete all notifications for the current user
  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.delete(notifRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profileData,
        userInitials,
        userProjects,
        userTasks,
        allProjectTasks,
        allAttachments,
        notifications,
        hasUnreadNotifications,
        usersMap,
        loading,
        getInitials,
        getMemberColor,
        logout,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};