import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// 1. استيراد Context
import { useApp } from '../context/AppContext';

interface ProfileScreenProps {
  onBack?: () => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
  onSecurityPress?: () => void;
  onHelpPress?: () => void;
}

export default function ProfileScreen({
  onBack,
  onEditProfile,
  onLogout,
  onSecurityPress,
  onHelpPress,
}: ProfileScreenProps) {
  // 2. سحب البيانات والدوال التلقائية من AppContext
  const { user, profileData, userProjects, userTasks, loading, logout } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // 3. حساب الإحصائيات من المجموعات الحية المجلوبة من AppContext
  const tasksDoneCount = userTasks.filter((t) => t.status === 'done').length;
  const pendingTasksCount = userTasks.filter(
    (t) => t.status === 'todo' || t.status === 'inprogress'
  ).length;

  const stats = [
    { n: String(userProjects.length), l: 'Projects' },
    { n: String(tasksDoneCount), l: 'Tasks done' },
    { n: String(pendingTasksCount), l: 'Pending' },
  ];

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
  };

  const menuItems = [
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M8 1a2.5 2.5 0 010 5A2.5 2.5 0 018 1zM2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5"
            stroke="#566551"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </Svg>
      ),
      label: 'Notifications',
      sub: notificationsEnabled ? 'All alerts on' : 'Muted',
      action: () => setNotificationsEnabled((prev) => !prev),
      isToggle: true,
      toggleValue: notificationsEnabled,
    },
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Circle cx="8" cy="8" r="3" stroke="#566551" strokeWidth="1.5" />
          <Path
            d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1"
            stroke="#566551"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </Svg>
      ),
      label: 'Theme',
      sub: isDarkTheme ? 'Dark' : 'Light',
      action: () => setIsDarkTheme((prev) => !prev),
      isToggle: true,
      toggleValue: isDarkTheme,
    },
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Rect
            x="4"
            y="7"
            width="8"
            height="7"
            rx="1.5"
            stroke="#566551"
            strokeWidth="1.5"
          />
          <Path
            d="M5.5 7V5a2.5 2.5 0 015 0v2"
            stroke="#566551"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Circle cx="8" cy="10.5" r="1" fill="#566551" />
        </Svg>
      ),
      label: 'Security & Password',
      sub: 'Manage password & auth',
      action: onSecurityPress,
      isToggle: false,
    },
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Circle cx="8" cy="8" r="6" stroke="#566551" strokeWidth="1.5" />
          <Path
            d="M8 7v4"
            stroke="#566551"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Circle cx="8" cy="5" r="0.8" fill="#566551" />
        </Svg>
      ),
      label: 'Help & Support',
      sub: 'FAQs, contact us',
      action: onHelpPress,
      isToggle: false,
    },
  ];

  const jobTitle = profileData?.jobTitle || 'Job Title';
  const company = profileData?.company || 'Company';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#566551" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M10 4L6 8l4 4"
                stroke="#1E293B"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Account</Text>

          <TouchableOpacity onPress={onEditProfile} style={styles.editBadge}>
            <Text style={styles.editBadgeText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(profileData?.fullName || user?.displayName || '')}
              </Text>
            </View>
            <View style={styles.statusDot} />
            <TouchableOpacity onPress={onEditProfile} style={styles.editAvatarBtn}>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <Path
                  d="M7 1.5L8.5 3M2 8l.5-2L7.5 1.5 8.5 3 3 7.5 2 8z"
                  stroke="#fff"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {profileData?.fullName || user?.displayName || 'User Name'}
          </Text>
          <Text style={styles.userEmail}>
            {profileData?.email || user?.email || 'user@example.com'}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {`${jobTitle} · ${company}`}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((s, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statNumber}>{s.n}</Text>
                <Text style={styles.statLabel}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.action ?? undefined}
                activeOpacity={item.action ? 0.7 : 1}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
              >
                <View style={styles.iconWrapper}>{item.icon}</View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>

                {item.isToggle ? (
                  <View
                    style={[
                      styles.toggleTrack,
                      { backgroundColor: item.toggleValue ? '#566551' : '#E2E8F0' },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        item.toggleValue ? styles.toggleThumbOn : styles.toggleThumbOff,
                      ]}
                    />
                  </View>
                ) : (
                  <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <Path
                      d="M5 3l4 4-4 4"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path
                  d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 4.5L14 8m0 0l-4 3.5M14 8H6"
                  stroke="#DC2626"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path
                d="M5 3l4 4-4 4"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.footerText}>Kora v2.1.0 · Made with ♥</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 12,
  },
  editBadge: {
    backgroundColor: '#C5D5E4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#566551',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#566551',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: '#F8F9FA',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#566551',
    borderWidth: 2,
    borderColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#C5D5E4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#566551',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    width: '100%',
    maxWidth: 320,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  menuContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 8,
  },
});