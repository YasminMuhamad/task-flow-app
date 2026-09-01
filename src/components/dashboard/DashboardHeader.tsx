import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import { getInitials, getMemberColor } from '../../context/AppContext';

interface Props {
  onProfileSelect: () => void;
  onNotifications: () => void;
  onSearch: () => void;
  hasUnreadNotifications?: boolean;
}

export const DashboardHeader: React.FC<Props> = ({
  onProfileSelect,
  onNotifications,
  onSearch,
  hasUnreadNotifications,
}) => {

  const { user, profileData, userProjects, userTasks, notifications = [], loading, getMemberColor, getInitials } = useApp();

  const hasUnread = useMemo(() => {
    if (typeof hasUnreadNotifications === 'boolean') {
      return hasUnreadNotifications;
    }
    return notifications.some((n) => !n.read);
  }, [notifications, hasUnreadNotifications]);

  const userName = profileData?.fullName || 'User';
  const userInitials = useMemo(() => getInitials(profileData?.fullName), [profileData?.fullName]);

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

  const userColor = getMemberColor(user?.uid || profileData?.uid || '');

  return (
    <View style={styles.header}>
      {/* User Info Header */}
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greetingText}>Good morning 👋</Text>
          <Text style={styles.welcomeText}>
            {loading ? 'Welcome back...' : `Welcome back, ${userName}`}
          </Text>
        </View>

        {/* Action Controls (Notifications + Profile Avatar) */}
        <View style={styles.actionGroup}>
          {/* Notification Button */}
          <TouchableOpacity
            style={styles.notifButton}
            onPress={onNotifications}
            activeOpacity={0.7}
          >
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1.5a4 4 0 014 4v2.5l1 2H3l1-2V5.5a4 4 0 014-4zM6.5 12a1.5 1.5 0 003 0"
                stroke="#566551"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>

            {hasUnread && <View style={styles.notifBadgeDot} />}
          </TouchableOpacity>

          {/* User Profile Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={[
                styles.avatar,
                { backgroundColor: getMemberColor(user?.uid || profileData?.uid || '') }
              ]}
              onPress={onProfileSelect}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials(profileData?.fullName || user?.displayName || '')}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.onlineBadge} />
          </View>
        </View>
      </View>

      {/* Search Bar Trigger */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={onSearch}
        activeOpacity={0.8}
      >
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <Circle cx="6" cy="6" r="4.5" stroke="#94A3B8" strokeWidth="1.3" />
          <Path d="M10 10l3 3" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
        </Svg>
        <Text style={styles.searchText}>Search tasks, projects, files...</Text>
      </TouchableOpacity>

      {/* Stats Row */}
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
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 12,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
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