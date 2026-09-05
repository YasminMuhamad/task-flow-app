import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MessageSquare,
  CheckCircle2,
  AtSign,
  Clock,
  UserPlus,
  Folder,
  Bell,
  BellOff,
} from "lucide-react-native";
import { AppNotification, NotificationType } from "../types/notification";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { formatTimeAgo, getMillis } from "../utils/date";

interface Props {
  onBack: () => void;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string }
> = {
  comment: { icon: MessageSquare, color: "#566551" },
  task: { icon: CheckCircle2, color: "#16A34A" },
  mention: { icon: AtSign, color: "#D97706" },
  deadline: { icon: Clock, color: "#DC2626" },
  invite: { icon: UserPlus, color: "#566551" },
  project: { icon: Folder, color: "#2563EB" },
  system: { icon: Bell, color: "#4B5563" },
};

interface NotificationCardProps {
  item: AppNotification;
  usersMap: Record<string, any>;
  userProjects: any[];
  getInitials: (name?: string) => string;
  getMemberColor: (userId: string) => string;
  onMarkAsRead: (id: string) => void;
}

interface NotificationSection {
  title: string;
  data: AppNotification[];
}

const groupNotificationsByDate = (
  notifications: AppNotification[]
): NotificationSection[] => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfThisWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const groups: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  notifications.forEach((item) => {
    const time = getMillis(item.createdAt);
    if (time >= startOfToday) {
      groups["Today"].push(item);
    } else if (time >= startOfYesterday) {
      groups["Yesterday"].push(item);
    } else if (time >= startOfThisWeek) {
      groups["This Week"].push(item);
    } else {
      groups["Older"].push(item);
    }
  });

  return Object.keys(groups)
    .filter((key) => groups[key].length > 0)
    .map((key) => ({
      title: key,
      data: groups[key],
    }));
};

const NotificationCard = React.memo(
  ({
    item,
    usersMap,
    userProjects,
    getInitials,
    getMemberColor,
    onMarkAsRead,
  }: NotificationCardProps) => {
    const { colors, isDark } = useTheme();
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
    const IconComponent = config.icon;

    const sender = item.senderId ? usersMap[item.senderId] : null;
    const senderName = sender?.fullName;
    const senderInitials = getInitials(senderName);
    const senderBgColor = getMemberColor(item.senderId || "");

    const project = userProjects?.find((p) => p.id === item.projectId);
    const projectName = project?.title || item.projectId || "Project";

    const isDeadline = item.type === "deadline";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onMarkAsRead(item.id)}
        style={[
          styles.card,
          {
            backgroundColor: item.read ? colors.card : colors.secondary,
            borderColor: item.read ? colors.border : (isDark ? colors.border : "#a8bece"),
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDeadline
                  ? (isDark ? "#451A1A" : "#FEF3C7")
                  : senderBgColor,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isDeadline ? "#D97706" : "#FFFFFF" },
              ]}
            >
              {isDeadline ? "⏰" : senderInitials}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { borderColor: item.read ? colors.background : colors.secondary },
            ]}
          >
            <IconComponent size={10} color={config.color} />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.notificationText,
              { color: colors.text, fontWeight: item.read ? "400" : "600" },
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.metaRow}>
            {item.projectId && (
              <View
                style={[
                  styles.projectTag,
                  {
                    backgroundColor: item.read
                      ? (isDark ? colors.secondary : "#F1F5F9")
                      : "rgba(86,101,81,0.12)",
                  },
                ]}
              >
                <Text style={[styles.projectTagText, { color: colors.primary }]}>{projectName}</Text>
              </View>
            )}
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.dotContainer}>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>
      </TouchableOpacity>
    );
  }
);

export default function NotificationsScreen({ onBack }: Props) {
  const { colors, isDark } = useTheme();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    usersMap,
    getInitials,
    getMemberColor,
    userProjects,
  } = useApp();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const sections = useMemo(() => {
    const displayedNotifs =
      filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications;

    return groupNotificationsByDate(displayedNotifs);
  }, [notifications, filter]);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <NotificationCard
      item={item}
      usersMap={usersMap}
      userProjects={userProjects}
      getInitials={getInitials}
      getMemberColor={getMemberColor}
      onMarkAsRead={markNotificationAsRead}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.headerTop, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              onPress={onBack} 
              style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          </View>
          
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllNotificationsAsRead}>
              <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 70 }} />
          )}
        </View>

        <View style={styles.filterRow}>
          {(["all", "unread"] as const).map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  isActive
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive
                      ? { color: colors.white }
                      : { color: colors.textMuted },
                  ]}
                >
                  {f === "all" ? "All" : "Unread"}
                </Text>
                {f === "unread" && unreadCount > 0 && (
                  <View
                    style={[
                      styles.badgeCount,
                      {
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.25)"
                          : colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.badgeCountText, { color: colors.white }]}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>{title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.secondary }]}>
              <BellOff size={24} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No notifications to display
            </Text>
          </View>
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <View style={styles.footerButtonContainer}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAllNotifications}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear All Notifications</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeCount: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeader: {
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  projectTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  projectTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 11,
  },
  dotContainer: {
    marginTop: 6,
    width: 8,
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 8,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 12,
  },
  footerButtonContainer: {
    marginTop: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  clearAllButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});