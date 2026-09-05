import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type EmptyStateVariant = 'projects' | 'tasks' | 'mine' | 'starred';

interface Props {
  variant?: EmptyStateVariant;
  title?: string;
  subtitle?: string;
  onCTA?: () => void;
}

const CONFIG = {
  projects: {
    title: 'No Active Projects Yet',
    sub: "You haven't created any projects. Start one and invite your team to collaborate.",
    cta: '+ Create First Project',
    illustration: (
      <Svg width="120" height="100" viewBox="0 0 120 100" fill="none">
        <Path d="M12 30h40l6-8h50v55a5 5 0 01-5 5H12a5 5 0 01-5-5V35a5 5 0 015-5z" fill="#fff" stroke="#C5D5E4" strokeWidth={2} />
        <Path d="M7 42h106" stroke="#C5D5E4" strokeWidth={1.5} strokeDasharray="4 4" />
        <Circle cx="60" cy="64" r="14" fill="#C5D5E4" opacity={0.4} />
        <Path d="M60 57v14M53 64h14" stroke="#566551" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    ),
  },
  mine: {
    title: 'No Work Assigned Yet',
    sub: "You haven't created or been assigned to any projects yet.",
    cta: '+ Create Project',
    illustration: (
      <Svg width="120" height="100" viewBox="0 0 120 100" fill="none">
        <Path d="M12 30h40l6-8h50v55a5 5 0 01-5 5H12a5 5 0 01-5-5V35a5 5 0 015-5z" fill="#fff" stroke="#C5D5E4" strokeWidth={2} />
        <Circle cx="60" cy="50" r="10" fill="#C5D5E4" opacity={0.5} />
        <Path d="M42 76c0-10 8-14 18-14s18 4 18 14" stroke="#566551" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    ),
  },
  starred: {
    title: 'No Starred Projects',
    sub: 'Mark important projects with a star to access them quickly here.',
    cta: '',
    illustration: (
      <Svg width="120" height="100" viewBox="0 0 120 100" fill="none">
        <Circle cx="60" cy="50" r="30" fill="#fff" stroke="#C5D5E4" strokeWidth={2} />
        <Path
          d="M60 32l5.5 11.2 12.3 1.8-8.9 8.7 2.1 12.3L60 60.2l-11 5.8 2.1-12.3-8.9-8.7 12.3-1.8L60 32z"
          fill="#C5D5E4"
          stroke="#566551"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  tasks: {
    title: 'All Clear!',
    sub: 'No tasks here yet. Add your first task and start tracking team progress.',
    cta: '+ Add First Task',
    illustration: (
      <Svg width="120" height="100" viewBox="0 0 120 100" fill="none">
        <Rect x="25" y="18" width="70" height="70" rx="10" fill="#fff" stroke="#C5D5E4" strokeWidth={2} />
        <Rect x="42" y="12" width="36" height="12" rx="6" fill="#C5D5E4" />
        <Circle cx="60" cy="60" r="18" fill="#C5D5E4" opacity={0.3} />
        <Path d="M50 60l7 7 13-14" stroke="#566551" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="35" y="36" width="50" height="4" rx="2" fill="#E2E8F0" />
        <Rect x="35" y="46" width="38" height="4" rx="2" fill="#E2E8F0" />
      </Svg>
    ),
  },
};

export default function EmptyStateScreen({ variant = 'projects', title, subtitle, onCTA }: Props) {
  const config = CONFIG[variant];

  const displayTitle = title || config.title;
  const displaySub = subtitle || config.sub;

  return (
    <View style={styles.container}>
      <View style={styles.illustrationBox}>{config.illustration}</View>

      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.sub}>{displaySub}</Text>

      {onCTA && config.cta ? (
        <TouchableOpacity activeOpacity={0.8} onPress={onCTA} style={styles.button}>
          <Text style={styles.buttonText}>{config.cta}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  illustrationBox: {
    width: 160,
    height: 140,
    borderRadius: 24,
    backgroundColor: '#C5D5E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#566551',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#566551',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});