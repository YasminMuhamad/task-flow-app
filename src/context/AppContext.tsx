import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, query, where, onSnapshot, documentId, collectionGroup } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { UserProfile } from '../types/user';
import { Project } from '../types/project';
import { Task, TaskAttachment } from '../types/task';

export const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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
  allAttachments: TaskAttachmentWithMeta[]; // Added attachments array
  usersMap: Record<string, UserProfile>;
  loading: boolean;
  getInitials: (name?: string) => string;
  logout: () => Promise<void>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [allProjectTasks, setAllProjectTasks] = useState<Task[]>([]);
  const [allAttachments, setAllAttachments] = useState<TaskAttachmentWithMeta[]>([]);
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
        setUsersMap({});
        setLoading(false);
      }
    });

    return unsubAuth;
  }, []);

  // 2. User profile, projects, and user tasks
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

  // 3. Sync all project tasks
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

  // 5. User profiles cache
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
  }, [user, userProjects]);

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
        usersMap,
        loading,
        getInitials,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);