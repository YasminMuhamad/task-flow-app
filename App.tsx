import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; // 👈 استيراد الأدوات
import { auth, db } from './src/api/firebase';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { COLORS } from './src/constants/theme';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { UserProfile } from './src/types/user';
import { Project } from './src/types/project';
import { Task } from './src/types/task';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // 📦 Cache للبيانات عشان تفتح فوراً
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 🚀 جلب البيانات فوراً في الخلفية أول ما يدخل
        prefetchUserData(currentUser.uid);
      } else {
        setSelectedProject(null);
        setShowProfile(false);
        setProfileData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // دالة الجلب المسبق
  const prefetchUserData = async (uid: string) => {
    try {
      // بنجيب البيانات كـ Parallel Promises لتسريع العملية جداً
      const userDocRef = doc(db, 'users', uid);
      const projectsQuery = query(collection(db, 'projects'), where('memberIds', 'array-contains', uid));
      const tasksQuery = query(collection(db, 'tasks'), where('assigneeId', '==', uid));

      const [userSnap, projectsSnap, tasksSnap] = await Promise.all([
        getDoc(userDocRef),
        getDocs(projectsQuery),
        getDocs(tasksQuery)
      ]);

      if (userSnap.exists()) {
        setProfileData({ uid, ...userSnap.data() } as UserProfile);
      }

      setUserProjects(projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      setUserTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    } catch (err) {
      console.error("Prefetch error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary || '#566551'} />
        </View>
      );
    }

    if (!user) {
      return <AuthScreen />;
    }

    if (showProfile) {
      return (
        <ProfileScreen 
          initialProfile={profileData}
          initialProjects={userProjects}
          initialTasks={userTasks}
          onBack={() => setShowProfile(false)} 
          onLogout={handleLogout}
        />
      );
    }

    if (selectedProject) {
      return (
        <ProjectDetailScreen 
          project={selectedProject} 
          onBack={() => setSelectedProject(null)} 
        />
      );
    }

    return (
      <DashboardScreen 
        onProjectSelect={(project) => setSelectedProject(project)} 
        onProfileSelect={() => setShowProfile(true)}
      />
    );
  };

  return (
    <SafeAreaProvider>
      {renderContent()}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg || '#F8F9FA',
  },
});