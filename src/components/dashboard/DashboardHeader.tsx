import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors } = useTheme();

  const hasUnread = useMemo(() => {
    if (typeof hasUnreadNotifications === 'boolean') {
      return hasUnreadNotifications;
    }
    return notifications.some((n) => !n.read);
  }, [notifications, hasUnreadNotifications]);

  const userName = profileData?.fullName || 'User';

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
          <Text style={[styles.greetingText, { color: colors.textMuted }]}>Good morning 👋</Text>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            {loading ? 'Welcome back...' : `Welcome back, ${userName ? userName.split(' ')[0] : ''}`}
          </Text>
        </View>
        {/* Action Controls (Notifications + Profile Avatar) */}
        <View style={styles.actionGroup}>
          {/* Notification Button */}
          <TouchableOpacity
            style={[
              styles.notifButton,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={onNotifications}
            activeOpacity={0.7}
          >
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1.5a4 4 0 014 4v2.5l1 2H3l1-2V5.5a4 4 0 014-4zM6.5 12a1.5 1.5 0 003 0"
                stroke={colors.primary}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>

            {hasUnread && (
              <View style={[styles.notifBadgeDot, { backgroundColor: colors.primary, borderColor: colors.card }]} />
            )}
          </TouchableOpacity>

          {/* User Profile Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={[
                styles.avatar,
                { backgroundColor: userColor }
              ]}
              onPress={onProfileSelect}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials(profileData?.fullName || user?.displayName || '')}
                </Text>
              )}
            </TouchableOpacity>
            <View style={[styles.onlineBadge, { borderColor: colors.background }]} />
          </View>
        </View>
      </View>

      {/* Search Bar Trigger */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          { backgroundColor: colors.card, borderColor: colors.border }
        ]}
        onPress={onSearch}
        activeOpacity={0.8}
      >
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <Circle cx="6" cy="6" r="4.5" stroke={colors.textMuted} strokeWidth="1.3" />
          <Path d="M10 10l3 3" stroke={colors.textMuted} strokeWidth="1.3" strokeLinecap="round" />
        </Svg>
        <Text style={[styles.searchText, { color: colors.textMuted }]}>
          Search tasks, projects, files...
        </Text>
      </TouchableOpacity>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {statsList.map((s) => (
          <View
            key={s.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.secondary }
            ]}
          >
            <Text style={[styles.statVal, { color: colors.text }]}>{s.val}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>{s.label}</Text>
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
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderWidth: 1.5,
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
    borderWidth: 1.5,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
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
    borderWidth: 1.5,
  },
  searchText: {
    fontSize: 14,
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
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});