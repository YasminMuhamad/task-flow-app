import React from "react";
import { View, Text } from "react-native";
import { HighlightedText } from "../HighlightedText";

export const ProjectCardItem = ({ project, query, usersMap, getInitials, getMemberColor, styles }: any) => (
  <View style={styles.projectCard}>
    <View style={styles.projectHeader}>
      <View style={styles.projectMeta}>
        {!!project.tag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{project.tag}</Text>
          </View>
        )}
        <HighlightedText text={project.title} query={query} style={styles.projectTitle} highlightStyle={{ backgroundColor: "#FEF08A", color: "#1E293B" }} />
      </View>
      <Text style={styles.progressText}>{project.progress || 0}%</Text>
    </View>

    <View style={styles.projectFooter}>
      <View style={styles.avatarStack}>
        {(project.memberIds || []).slice(0, 3).map((mId: string, index: number) => {
          const memberName = usersMap[mId]?.fullName;
          return (
            <View key={mId || index} style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0, backgroundColor: getMemberColor(mId) }]}>
              <Text style={styles.avatarText}>{getInitials(memberName)}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${project.progress || 0}%` }]} />
      </View>
    </View>
  </View>
);