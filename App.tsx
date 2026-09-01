import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppProvider, useApp } from './src/context/AppContext';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ArchivedTasksScreen from './src/screens/ArchivedTasksScreen';
import SearchScreen from './src/screens/SearchScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { COLORS } from './src/constants/theme';
import { Project } from './src/types/project';

const ONBOARDING_KEY = '@kora_has_seen_onboarding';

function MainNavigator() {
  const { user, loading, logout } = useApp();

  const [appStage, setAppStage] = useState<'splash' | 'onboarding' | 'ready'>('splash');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      setShowProfile(false);
      setShowEditProfile(false);
      setSelectedProject(null);
      setSelectedTaskId(null);
      setShowArchivedTasks(false);
      setShowSearch(false);
      setShowNotifications(false);
    }
  }, [user]);

  const handleSplashDone = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (hasSeen === 'true') {
        setAppStage('ready');
      } else {
        setAppStage('onboarding');
      }
    } catch {
      setAppStage('ready');
    }
  };

  const handleOnboardingDone = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    setAppStage('ready');
  };

  if (appStage === 'splash') {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (appStage === 'onboarding') {
    return <OnboardingScreen onDone={handleOnboardingDone} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || '#566551'} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  if (showSearch) {
    return <SearchScreen onBack={() => setShowSearch(false)} />;
  }

  if (showEditProfile) {
    return <EditProfileScreen onBack={() => setShowEditProfile(false)} />;
  }

  if (showProfile) {
    return (
      <ProfileScreen
        onBack={() => setShowProfile(false)}
        onEditProfile={() => setShowEditProfile(true)}
        onLogout={logout}
      />
    );
  }

  if (selectedTaskId) {
    return (
      <TaskDetailScreen
        taskId={selectedTaskId}
        onBack={() => setSelectedTaskId(null)}
      />
    );
  }

  if (showArchivedTasks && selectedProject) {
    return (
      <ArchivedTasksScreen
        project={selectedProject}
        onBack={() => setShowArchivedTasks(false)}
        onTaskSelect={(taskId) => setSelectedTaskId(taskId.toString())}
      />
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetailScreen
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onTaskSelect={(taskId) => setSelectedTaskId(taskId)}
        onOpenArchived={() => setShowArchivedTasks(true)}
      />
    );
  }

  return (
    <DashboardScreen
      onProjectSelect={(project) => setSelectedProject(project)}
      onProfileSelect={() => setShowProfile(true)}
      onSearch={() => setShowSearch(true)}
      onNotifications={() => setShowNotifications(true)}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <MainNavigator />
        </AppProvider>
      </ThemeProvider>
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