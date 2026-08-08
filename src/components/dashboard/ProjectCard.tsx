import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { COLORS } from '../../constants/theme';
import { Project } from '../../types/project';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

const formatTimeAgo = (dateValue?: Timestamp | Date): string => {
  if (!dateValue) return 'Active';

  const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return 'Just now';

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) return `${daysAgo}d ago`;

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) return `${monthsAgo}mo ago`;

  const yearsAgo = Math.floor(daysAgo / 365);
  return `${yearsAgo}y ago`;
};

// getMemberColor function to generate a color based on the member's initials
const getMemberColor = (str: string) => {
  const colors = ['#566551', '#C5D5E4', '#8DA68A', '#A8BECE', '#3F4B3C'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// getTagColor function to generate a color based on the tag
const getTagColor = (tag: string) => {
  switch (tag?.toLowerCase()) {
    case 'design':
      return COLORS.primary;
    case 'engineering':
      return COLORS.text;
    default:
      return COLORS.primaryLight || '#566551';
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const [membersInitials, setMembersInitials] = useState<string[]>([]);
  
  // State for task statistics
  const [taskStats, setTaskStats] = useState({
    doneCount: 0,
    totalCount: 0,
    progress: project.progress || 0,
  });

  const tagColor = getTagColor(project.tag);

  // calculate task statistics when the component mounts or when the project changes
  useEffect(() => {
    let isMounted = true;

    const fetchProjectTasks = async () => {
      if (!project.id) return;

      try {
        const q = query(
          collection(db, 'tasks'),
          where('projectId', '==', project.id)
        );
        const querySnapshot = await getDocs(q);

        const totalCount = querySnapshot.size;
        let doneCount = 0;

        querySnapshot.forEach((docSnap) => {
          if (docSnap.data().status === 'done') {
            doneCount++;
          }
        });

        const computedProgress =
          totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : project.progress || 0;

        if (isMounted) {
          setTaskStats({
            doneCount,
            totalCount,
            progress: computedProgress,
          });
        }
      } catch (error) {
        console.error('Error fetching project tasks:', error);
      }
    };

    fetchProjectTasks();

    return () => {
      isMounted = false;
    };
  }, [project.id, project.progress]);

  // fetch member initials when the component mounts or when the project changes
  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      if (!project.memberIds || project.memberIds.length === 0) return;

      try {
        const fetchedInitials = await Promise.all(
          project.memberIds.slice(0, 4).map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const fullName = userDoc.data()?.fullName || 'User';
              const parts = fullName.trim().split(' ');
              if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
              }
              return fullName.substring(0, 2).toUpperCase();
            }
            return 'U';
          })
        );

        if (isMounted) {
          setMembersInitials(fetchedInitials);
        }
      } catch (error) {
        console.error('Error fetching member initials:', error);
      }
    };

    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [project.memberIds]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      {/* Card Top */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagBadgeContainer}>
            <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20` }]}>
              <Text style={[styles.tagText, { color: tagColor }]}>{project.tag}</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>{project.title}</Text>
          {project.desc ? <Text style={styles.cardDesc}>{project.desc}</Text> : null}
        </View>
        <View style={styles.arrowIconContainer}>
          <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <Path
              d="M3 7h8M7 3l4 4-4 4"
              stroke={COLORS.primary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>

      {/* Progress Dynamic Display */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.tasksText}>
            {taskStats.doneCount}/{taskStats.totalCount} tasks
          </Text>
          <Text style={styles.progressPercent}>{taskStats.progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${taskStats.progress}%` }]} />
        </View>
      </View>

      {/* Members */}
      <View style={styles.cardFooter}>
        <View style={styles.membersRow}>
          {membersInitials.slice(0, 3).map((initials, i) => (
            <View
              key={i}
              style={[
                styles.memberAvatar,
                {
                  backgroundColor: getMemberColor(initials + i),
                  marginLeft: i > 0 ? -8 : 0,
                },
              ]}
            >
              <Text style={styles.memberText}>{initials}</Text>
            </View>
          ))}
          {project.memberIds && project.memberIds.length > 3 && (
            <View style={[styles.memberAvatar, styles.extraMemberAvatar]}>
              <Text style={styles.extraMemberText}>+{project.memberIds.length - 3}</Text>
            </View>
          )}
        </View>

        <Text style={styles.updatedText}>
          {project.createdAt ? `Updated ${formatTimeAgo(project.createdAt)}` : 'Active'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 16,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tagBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.text,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
    color: COLORS.primary,
  },
  arrowIconContainer: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tasksText: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.6,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(86,101,81,0.15)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  memberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  extraMemberAvatar: {
    backgroundColor: COLORS.border,
    marginLeft: -8,
  },
  extraMemberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.muted,
  },
  updatedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});