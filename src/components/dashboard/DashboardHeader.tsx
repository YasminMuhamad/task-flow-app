import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext'; // اضبط المسار حسب هيكلة مشروعك
import { COLORS } from '../../constants/theme';

interface Props {
  onProfileSelect: () => void;
}

// دالة الحروف الأولى
const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const DashboardHeader: React.FC<Props> = ({ onProfileSelect }) => {
  // جلب كل البيانات الجاهزة من AppContext
  const { profileData, userProjects, userTasks, loading } = useApp();

  // حساب الأحرف الأولى
  const userName = profileData?.fullName || 'User';
  const userInitials = useMemo(() => getInitials(profileData?.fullName), [profileData?.fullName]);

  // حساب الإحصائيات فورياً بدون استعلامات شبكة
  const statsList = useMemo(() => {
    const projectsCount = userProjects.length;
    const completedTasksCount = userTasks.filter((t) => t.status === 'done').length;
    const tasksDueCount = userTasks.length - completedTasksCount;

    return [
      { label: 'Projects', val: projectsCount.toString() },
      { label: 'Tasks Due', val: tasksDueCount.toString() },
      { label: 'Completed', val: completedTasksCount.toString() },
    ];
  }, [userProjects, userTasks]);

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greetingText}>Good morning 👋</Text>
          <Text style={styles.welcomeText}>
            {loading ? 'Welcome back...' : `Welcome back, ${userName}`}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={onProfileSelect}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.avatarText}>{userInitials}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.onlineBadge} />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {statsList.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  onlineBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.secondary,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});