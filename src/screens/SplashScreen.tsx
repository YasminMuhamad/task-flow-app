import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('ready');
          return 100;
        }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Center Logo Lockup (هينزل في المنتصف بالضبط) */}
        <View style={styles.centerSection}>
          {/* Animated Mark Container */}
          <View style={styles.logoCard}>
            <Svg width={42} height={42} viewBox="0 0 42 42" fill="none">
              <Path
                d="M10 21 L17 28 L32 13"
                stroke="#F8F9FA"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx={21}
                cy={21}
                r={17}
                stroke="#C5D5E4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            </Svg>
          </View>

          {/* Wordmark */}
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>Kora</Text>
            <Text style={styles.subtitle}>Simplified Team Productivity</Text>
          </View>

          {/* Tag Group */}
          <View style={styles.tagGroup}>
            {['Tasks', 'Projects', 'Teams'].map(t => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Actions & Progress (هينزل تحت خالص) */}
        <View style={styles.bottomSection}>
          {phase === 'loading' ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.loadingText}>Loading workspace...</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onDone}
              activeOpacity={0.8}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Get Started →</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.versionText}>Kora v2.1.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoCard: {
    width: 80,
    height: 80,
    backgroundColor: '#566551',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#566551',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#566551',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#C5D5E4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#566551',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 16,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: 192,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#566551',
    borderRadius: 999,
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#566551',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#566551',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  versionText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});