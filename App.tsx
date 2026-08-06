import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/api/firebase';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { COLORS } from './src/constants/theme';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import { Project } from './src/types/project';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSelectedProject(null); // تصفير المشروع عند تسجيل الخروج
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || '#566551'} />
      </View>
    );
  }

  // إذا لم يسجل الدخول -> شاشة الدخول
  if (!user) {
    return <AuthScreen />;
  }

  // إذا كان مسجلاً واختار مشروعاً -> شاشة التفاصيل
  if (selectedProject) {
    return (
      <ProjectDetailScreen 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
        onCreateTask={() => {
          
        }} 
      />
    );
  }

  // افتراضياً -> شاشة Dashboard
  return (
    <DashboardScreen 
      onProjectSelect={(project) => setSelectedProject(project)} 
    />
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