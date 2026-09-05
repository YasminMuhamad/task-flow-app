import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FilterTabs, FilterTab } from '../components/dashboard/FilterTabs';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { Project } from '../types/project';
import EmptyStateScreen, { EmptyStateVariant } from '../components/EmptyStateScreen';

interface Props {
  onProjectSelect?: (project: Project) => void;
  onProfileSelect: () => void;
  onSearch: () => void;
  onNotifications: () => void;
}

export default function DashboardScreen({
  onProjectSelect = () => {},
  onProfileSelect,
  onSearch,
  onNotifications,
}: Props) {
  const { userProjects, user, loading } = useApp();
  const { colors } = useTheme();
  
  const [active, setActive] = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const insets = useSafeAreaInsets();

  const filteredProjects = useMemo(() => {
    let list = [...userProjects];

    if (active === 'mine') {
      list = list.filter((p) => p.createdBy === user?.uid);
    } else if (active === 'starred') {
      list = list.filter((p) => p.starredBy?.includes(user?.uid || ''));
    }

    return list.sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val.toMillis === 'function') return val.toMillis();
        return new Date(val).getTime() || 0;
      };

      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }, [userProjects, active, user?.uid]);

  const displayedProjects = useMemo(() => {
    return showAll ? filteredProjects : filteredProjects.slice(0, 4);
  }, [filteredProjects, showAll]);

  const emptyVariant: EmptyStateVariant = active === 'all' ? 'projects' : active;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <DashboardHeader onProfileSelect={onProfileSelect} onSearch={onSearch} onNotifications={onNotifications} />

        {/* Filter tabs */}
        <FilterTabs activeTab={active} onTabChange={setActive} />

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Projects</Text>
          {filteredProjects.length > 4 && (
            <TouchableOpacity onPress={() => setShowAll(prev => !prev)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                {showAll ? 'Show less ←' : 'See all →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Project cards */}
        <View style={styles.cardsList}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : filteredProjects.length === 0 ? (
            <EmptyStateScreen
              variant={emptyVariant}
              onCTA={() => setModalVisible(true)}
            />
          ) : (
            displayedProjects.map((p) => (
              <ProjectCard 
                key={p.id} 
                project={p} 
                onPress={() => onProjectSelect(p)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB Button for New Project */}
      {userProjects.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.9}
            style={[
              styles.fabButton, 
              { backgroundColor: colors.primary, shadowColor: colors.primary, bottom: insets.bottom } 
            ]}
          >
            <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <Path d="M11 4v14M4 11h14" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={[styles.fabText, { color: colors.primary, bottom: insets.bottom }]}>New</Text>
        </View>
      )}
      
      {/* Create Project Modal */}
      <CreateProjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onProjectCreated={() => {
          setModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold' },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  cardsList: { paddingHorizontal: 20, gap: 12 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  fabContainer: { position: 'absolute', bottom: 10, right: 20, alignItems: 'center' },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  fabText: { textAlign: 'center', fontSize: 12, marginTop: 4, fontWeight: '500' },
});