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

import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

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
  const { user, profileData, userProjects, userTasks, loading, logout, getInitials, getMemberColor } = useApp();
  const { isDark, colors, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // State for "Coming Soon" modal
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState('');

  const tasksDoneCount = userTasks?.filter((t: any) => t.status === 'done').length || 0;
  const pendingTasksCount = userTasks?.filter(
    (t: any) => t.status === 'todo' || t.status === 'inprogress'
  ).length || 0;

  const stats = [
    { n: String(userProjects?.length || 0), l: 'Projects' },
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

  // Function to handle "Coming Soon" features
  const handleComingSoon = (featureName: string, customAction?: () => void) => {
    if (customAction) {
      customAction();
    } else {
      setActiveFeature(featureName);
      setComingSoonVisible(true);
    }
  };

  const menuItems = [
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M8 1a2.5 2.5 0 010 5A2.5 2.5 0 018 1zM2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5"
            stroke={colors.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </Svg>
      ),
      label: 'Personal Information',
      sub: 'Update name, job & company',
      action: onEditProfile,
      isToggle: false,
    },
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M8 1a2.5 2.5 0 010 5A2.5 2.5 0 018 1zM2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5"
            stroke={colors.primary}
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
          <Circle cx="8" cy="8" r="3" stroke={colors.primary} strokeWidth="1.5" />
          <Path
            d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 3.2l-1 1M4.2 11.8l-1 1"
            stroke={colors.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </Svg>
      ),
      label: 'Theme',
      sub: isDark ? 'Dark' : 'Light',
      action: toggleTheme,
      isToggle: true,
      toggleValue: isDark,
    },
    // Additional menu items that are "Coming Soon"
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Rect
            x="4"
            y="7"
            width="8"
            height="7"
            rx="1.5"
            stroke={colors.primary}
            strokeWidth="1.5"
          />
          <Path
            d="M5.5 7V5a2.5 2.5 0 015 0v2"
            stroke={colors.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Circle cx="8" cy="10.5" r="1" fill={colors.primary} />
        </Svg>
      ),
      label: 'Security & Password',
      sub: 'Manage password & auth',
      action: () => handleComingSoon('Security & Password', onSecurityPress),
      isToggle: false,
    },
    {
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Circle cx="8" cy="8" r="6" stroke={colors.primary} strokeWidth="1.5" />
          <Path
            d="M8 7v4"
            stroke={colors.primary}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Circle cx="8" cy="5" r="0.8" fill={colors.primary} />
        </Svg>
      ),
      label: 'Help & Support',
      sub: 'FAQs, contact us',
      action: () => handleComingSoon('Help & Support', onHelpPress),
      isToggle: false,
    },
  ];

  const jobTitle = profileData?.jobTitle || 'Job Title';
  const company = profileData?.company || 'Company';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, styles.loadingCenter]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const userColor = getMemberColor(user?.uid || profileData?.uid || '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path
                  d="M10 4L6 8l4 4"
                  stroke={colors.text}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}

          <Text style={[styles.headerTitle, { color: colors.text }, !onBack && { marginLeft: 0 }]}>My Account</Text>
        </View>

        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: userColor }]}>
              <Text style={styles.avatarText}>
                {getInitials(profileData?.fullName || user?.displayName || '')}
              </Text>
            </View>
            <View style={[styles.statusDot, { borderColor: colors.background }]} />
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>
            {profileData?.fullName || user?.displayName || 'User Name'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>
            {profileData?.email || user?.email || 'user@example.com'}
          </Text>

          <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
              {`${jobTitle} · ${company}`}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((s, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNumber, { color: colors.text }]}>{s.n}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.action ?? undefined}
                activeOpacity={item.action ? 0.7 : 1}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: colors.background }]}>{item.icon}</View>

                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>{item.sub}</Text>
                </View>

                {item.isToggle ? (
                  <View
                    style={[
                      styles.toggleTrack,
                      { backgroundColor: item.toggleValue ? colors.primary : colors.border },
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
                      stroke={colors.textMuted}
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
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.dangerLight }]}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path
                  d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 4.5L14 8m0 0l-4 3.5M14 8H6"
                  stroke={colors.danger}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={[styles.logoutText, { color: colors.text }]}>Log Out</Text>
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path
                d="M5 3l4 4-4 4"
                stroke={colors.textMuted}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={[styles.footerText, { color: colors.textMuted }]}>Kora v2.1.0 · Made with ♥</Text>
        </View>
      </ScrollView>

      {/* Coming Soon Modal */}
      {comingSoonVisible && (
        <BlurView style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Coming Soon!</Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              {activeFeature} is currently under development and will be available in the next update.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setComingSoonVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomWidth: 1.5,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
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
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
    borderWidth: 1.5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  menuContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 12,
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
  },
  menuSub: {
    fontSize: 12,
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
    borderWidth: 1.5,
    marginTop: 4,
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
  // Coming Soon Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});