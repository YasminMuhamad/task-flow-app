import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { COLORS } from './src/constants/theme';
import { Project } from './src/types/project';

function MainNavigator() {
  const { user, loading, logout } = useApp();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // إعادة تعيين الشاشة للداشبورد عند تغيير حالة المستخدم
  useEffect(() => {
    if (user) {
      setShowProfile(false);
      setSelectedProject(null);
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

  if (selectedProject) {
    return (
      <ProjectDetailScreen 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  // الصفحة الافتراضية بعد تسجيل الدخول
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