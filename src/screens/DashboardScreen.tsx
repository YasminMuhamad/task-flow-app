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

// 1. استيراد useApp من الـ Context
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FilterTabs, FilterTab } from '../components/dashboard/FilterTabs';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { Project } from '../types/project';

interface Props {
  onProjectSelect?: (project: Project) => void;
  onProfileSelect: () => void;
}

export default function DashboardScreen({
  onProjectSelect = () => {},
  onProfileSelect,
}: Props) {
  // 2. سحب المشاريع وحالة التحميل من الـ Context مباشرة
  const { userProjects, loading } = useApp();
  
  const [active, setActive] = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  // 3. ترتيب المشاريع (تصاعدياً/تنازلياً) باستخدام useMemo لضمان الأداء وعدم تعديل المصفوفة الأصلية
  const sortedProjects = useMemo(() => {
    return [...userProjects].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
      return dateB - dateA;
    });
  }, [userProjects]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <DashboardHeader onProfileSelect={onProfileSelect} />

        {/* Filter tabs */}
        <FilterTabs activeTab={active} onTabChange={setActive} />

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Projects</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>

        {/* Project cards */}
        <View style={styles.cardsList}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : sortedProjects.length === 0 ? (
            <Text style={styles.emptyText}>No projects found for you</Text>
          ) : (
            sortedProjects.map((p) => (
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
      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.9}
          style={[
          styles.fabButton, 
          { bottom: insets.bottom } 
        ]}
        >
          <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <Path d="M11 4v14M4 11h14" stroke={COLORS.white} strokeWidth="2.5" strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={[styles.fabText, { bottom: insets.bottom }]}>New</Text>
      </View>

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
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  seeAllText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  cardsList: { paddingHorizontal: 20, gap: 12 },
  emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 20, fontSize: 14 },
  fabContainer: { position: 'absolute', bottom: 10, right: 20, alignItems: 'center' },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  fabText: { textAlign: 'center', fontSize: 12, marginTop: 4, fontWeight: '500', color: COLORS.primary },
});