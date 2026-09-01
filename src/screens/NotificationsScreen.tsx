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
  BellOff,
  Folder,
  Bell,
} from "lucide-react-native";
import { AppNotification, NotificationType } from "../types/notification";
import { useApp } from "../context/AppContext";
import { formatTimeAgo, getMillis } from "../utils/date";

interface Props {
  onBack: () => void;
}

// Configuration for notification types with icons and colors
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
  onMarkAsRead: (id: string) => void;
}

// Grouping helper function
interface NotificationSection {
  title: string;
  data: AppNotification[];
}

const groupNotificationsByDate = (
  notifications: AppNotification[]
): NotificationSection[] => {
  const now = new Date();

  // Start of today (00:00:00)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  // Start of yesterday
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  // Start of this week (last 7 days)
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

// Optimized individual notification card component
const NotificationCard = React.memo(
  ({
    item,
    usersMap,
    userProjects,
    getInitials,
    onMarkAsRead,
  }: NotificationCardProps) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
    const IconComponent = config.icon;

    // Get sender initials
    const sender = item.senderId ? usersMap[item.senderId] : null;
    const senderInitials = sender ? getInitials(sender.fullName) : "UN";

    // Find project name based on project ID
    const project = userProjects?.find((p) => p.id === item.projectId);
    const projectName = project?.title || item.projectId || "Project";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onMarkAsRead(item.id)}
        style={[
          styles.card,
          item.read ? styles.cardRead : styles.cardUnread,
        ]}
      >
        {/* Avatar Container */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor:
                  item.type === "deadline" ? "#FEF3C7" : "#C5D5E4",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: item.type === "deadline" ? "#D97706" : "#1E293B" },
              ]}
            >
              {item.type === "deadline" ? "⏰" : senderInitials}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { borderColor: item.read ? "#F8F9FA" : "#C5D5E4" },
            ]}
          >
            <IconComponent size={10} color={config.color} />
          </View>
        </View>

        {/* Text Details */}
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.notificationText,
              { fontWeight: item.read ? "400" : "600" },
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
                      ? "#F1F5F9"
                      : "rgba(86,101,81,0.12)",
                  },
                ]}
              >
                <Text style={styles.projectTagText}>{projectName}</Text>
              </View>
            )}
            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Unread Indicator Dot */}
        <View style={styles.dotContainer}>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  }
);

export default function NotificationsScreen({ onBack }: Props) {
  // Consume data and actions from AppContext
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    usersMap,
    getInitials,
    userProjects,
  } = useApp();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Compute unread count and grouped list
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
      onMarkAsRead={markNotificationAsRead}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllNotificationsAsRead}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 70 }} />
          )}
        </View>

        {/* Filter Pills */}
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
                    ? styles.filterPillActive
                    : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive
                      ? styles.filterTextActive
                      : styles.filterTextInactive,
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
                          : "#566551",
                      },
                    ]}
                  >
                    <Text style={styles.badgeCountText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Grouped Notifications List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <BellOff size={24} color="#566551" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
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
                <Text style={styles.clearAllText}>Clear All Notifications</Text>
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#F8F9FA",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#566551",
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
  filterPillActive: {
    backgroundColor: "#566551",
    borderColor: "#566551",
  },
  filterPillInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  filterTextInactive: {
    color: "#64748B",
  },
  badgeCount: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCountText: {
    color: "#FFFFFF",
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
    backgroundColor: "#F8F9FA",
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
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
  },
  cardUnread: {
    backgroundColor: "#C5D5E4",
    borderWidth: 1.5,
    borderColor: "#a8bece",
  },
  cardRead: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: "#1E293B",
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
    color: "#566551",
  },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
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
    backgroundColor: "#566551",
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
    backgroundColor: "#C5D5E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94A3B8",
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
    color: "#566551",
    fontSize: 13,
    fontWeight: "600",
  },
});