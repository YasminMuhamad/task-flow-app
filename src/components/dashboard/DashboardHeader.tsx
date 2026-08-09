import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../api/firebase'; 
import { COLORS } from '../../constants/theme';

interface Props {
  onProfileSelect: () => void;
}

export const DashboardHeader: React.FC<Props> = ({ onProfileSelect }) => {
  const [userName, setUserName] = useState<string>('User');
  const [userInitials, setUserInitials] = useState<string>('U');
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksDueCount: 0,
    completedTasksCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const fullName = data.fullName || 'User';
          setUserName(fullName);
          setUserInitials(getInitials(fullName));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    const projectsQuery = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', currentUser.uid)
    );

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsCount = snapshot.size;

      setStats((prev) => ({
        ...prev,
        projectsCount,
      }));
    });

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('assigneeId', '==', currentUser.uid)
    );

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      let due = 0;
      let completed = 0;

      snapshot.docs.forEach((doc) => {
        const taskData = doc.data();
        if (taskData.status === 'done') {
          completed += 1;
        } else {
          due += 1;
        }
      });

      setStats((prev) => ({
        ...prev,
        tasksDueCount: due,
        completedTasksCount: completed,
      }));

      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, []);

  const statsList = [
    { label: 'Projects', val: stats.projectsCount.toString() },
    { label: 'Tasks Due', val: stats.tasksDueCount.toString() },
    { label: 'Completed', val: stats.completedTasksCount.toString() },
  ];

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
      onPress={() => onProfileSelect()}
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