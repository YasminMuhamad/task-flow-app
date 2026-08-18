import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen'; // 👈 استيراد شاشة تفاصيل المهمة
import ProfileScreen from './src/screens/ProfileScreen';
import { COLORS } from './src/constants/theme';
import { Project } from './src/types/project';

function MainNavigator() {
  const { user, loading, logout } = useApp();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null); // 👈 State لتتبع التاسك المحددة
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setShowProfile(false);
      setSelectedProject(null);
      setSelectedTaskId(null);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || '#566551'} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  if (showProfile) {
    return (
      <ProfileScreen 
        onBack={() => setShowProfile(false)} 
        onLogout={logout}
      />
    );
  }

  // 👈 عرض شاشة تفاصيل المهمة إذا تم التحديد
  if (selectedTaskId) {
    return (
      <TaskDetailScreen
        taskId={selectedTaskId}
        onBack={() => setSelectedTaskId(null)}
      />
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetailScreen 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
        onTaskSelect={(taskId) => setSelectedTaskId(taskId)} // 👈 ربط الـ Callback هنا
      />
    );
  }

  return (
    <DashboardScreen 
      onProjectSelect={(project) => setSelectedProject(project)} 
      onProfileSelect={() => setShowProfile(true)}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainNavigator />
      </AppProvider>
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