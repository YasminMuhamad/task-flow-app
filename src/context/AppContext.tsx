import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, query, where, onSnapshot, documentId } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { UserProfile } from '../types/user';
import { Project } from '../types/project';
import { Task } from '../types/task';

export const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

interface AppContextType {
  user: User | null;
  profileData: UserProfile | null;
  userInitials: string;
  userProjects: Project[];
  userTasks: Task[]; // المهام المنسوبة للمستخدم الحالي
  allProjectTasks: Task[]; // كافة المهام الخاصة بجميع مشاريع المستخدم
  usersMap: Record<string, UserProfile>; // قاموس لتخزين بيانات الأعضاء وقراءتها مباشرة $O(1)$
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
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  const userInitials = useMemo(() => {
    return getInitials(profileData?.fullName);
  }, [profileData?.fullName]);
  
  // 
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfileData(null);
        setUserProjects([]);
        setUserTasks([]);
        setAllProjectTasks([]);
        setUsersMap({});
        setLoading(false);
      }
    });

    return unsubAuth;
  }, []);

  // 2. المزامنة اللحظية مع بيانات المستخدم ومقاطعاته
  useEffect(() => {
    if (!user) return;

    // حساب المستخدم
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData({ uid: user.uid, ...docSnap.data() } as UserProfile);
      }
    });

    // مشاريع المستخدم
    const qProjects = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', user.uid)
    );
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setUserProjects(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
    });

    // مهام المستخدم الخاصة
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

  // 3. مزامنة لحظية لكافة المهام الخاصة بمشاريع المستخدم
  useEffect(() => {
    if (!user || userProjects.length === 0) {
      setAllProjectTasks([]);
      return;
    }

    const projectIds = userProjects.map((p) => p.id);
    
    // تقسيم الاستعلام لقمع حد الـ 30 عنصر في Firestore `in` query
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

  // 4. جلب ومزامنة بيانات الأعضاء (User Profiles Cache)
  useEffect(() => {
    if (!user || userProjects.length === 0) return;

    // استخراج معرفات جميع الأعضاء عبر المشاريع
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