import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

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
          onDone();
          return 100;
        }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
        </View>

        <View style={styles.bottomSection}>
          {phase === 'loading' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: ${progress}% }]} />
              </View>
              <Text style={styles.loadingText}>Loading workspace...</Text>
            </View>
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
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
    backgroundColor: COLORS.secondary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 999,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
});