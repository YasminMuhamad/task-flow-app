import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Path, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    num: '01',
    title: 'Organize Work\nSeamlessly',
    sub: 'Manage team projects, tasks, and deadlines all in one clean, distraction-free workspace.',
    illustration: (
      <Svg width={160} height={120} viewBox="0 0 160 120" fill="none">
        <Rect x={20} y={20} width={120} height={80} rx={14} fill="#fff" opacity={0.7} />
        <Rect x={34} y={36} width={6} height={6} rx={2} fill="#566551" />
        <Rect x={46} y={37} width={50} height={4} rx={2} fill="#566551" opacity={0.5} />
        <Rect x={104} y={37} width={24} height={4} rx={2} fill="#C5D5E4" />
        <Rect x={34} y={48} width={92} height={3} rx={1.5} fill="#E2E8F0" />
        <Rect x={34} y={48} width={62} height={3} rx={1.5} fill="#566551" />
        <Rect x={34} y={60} width={6} height={6} rx={2} fill="#C5D5E4" />
        <Rect x={46} y={61} width={40} height={4} rx={2} fill="#566551" opacity={0.3} />
        <Rect x={94} y={61} width={30} height={4} rx={2} fill="#C5D5E4" />
        <Rect x={34} y={74} width={6} height={6} rx={2} fill="#8DA68A" />
        <Rect x={46} y={75} width={55} height={4} rx={2} fill="#566551" opacity={0.3} />
        <Rect x={109} y={75} width={17} height={4} rx={2} fill="#C5D5E4" />
        <Circle cx={130} cy={90} r={10} fill="#566551" />
        <Path d="M126 90h8M130 86v8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    num: '02',
    title: 'Collaborate\nin Real-Time',
    sub: 'Stay updated with live comments, @mentions, and instant notifications from your team.',
    illustration: (
      <Svg width={160} height={120} viewBox="0 0 160 120" fill="none">
        <Rect x={20} y={18} width={90} height={28} rx={12} fill="#fff" opacity={0.8} />
        <Circle cx={32} cy={32} r={8} fill="#566551" />
        <SvgText x={32} y={35} textAnchor="middle" fill="#fff" fontSize={7}>SC</SvgText>
        <Rect x={46} y={26} width={54} height={4} rx={2} fill="#1E293B" opacity={0.2} />
        <Rect x={46} y={34} width={36} height={4} rx={2} fill="#1E293B" opacity={0.1} />
        <Rect x={50} y={54} width={90} height={28} rx={12} fill="#C5D5E4" opacity={0.9} />
        <Circle cx={62} cy={68} r={8} fill="#8DA68A" />
        <SvgText x={62} y={71} textAnchor="middle" fill="#fff" fontSize={7}>TK</SvgText>
        <Rect x={76} y={62} width={50} height={4} rx={2} fill="#566551" opacity={0.4} />
        <Rect x={76} y={70} width={32} height={4} rx={2} fill="#566551" opacity={0.25} />
        <Circle cx={132} cy={26} r={14} fill="#566551" opacity={0.1} />
        <Path d="M132 19a5 5 0 015 5v3l1.5 2.5h-13L127 27v-3a5 5 0 015-5zM130 30.5a2 2 0 004 0" stroke="#566551" strokeWidth={1.3} strokeLinecap="round" />
        <Circle cx={136} cy={20} r={3} fill="#DC2626" />
        <Rect x={20} y={90} width={50} height={20} rx={10} fill="#fff" opacity={0.7} />
        <Circle cx={35} cy={100} r={2.5} fill="#566551" opacity={0.5} />
        <Circle cx={45} cy={100} r={2.5} fill="#566551" opacity={0.7} />
        <Circle cx={55} cy={100} r={2.5} fill="#566551" />
      </Svg>
    ),
  },
  {
    num: '03',
    title: 'Track Progress\nEasily',
    sub: 'Simple status updates, clear deadlines, and visual progress make it effortless to stay on track.',
    illustration: (
      <Svg width={160} height={120} viewBox="0 0 160 120" fill="none">
        <Circle cx={80} cy={60} r={40} stroke="#E2E8F0" strokeWidth={7} />
        <Circle cx={80} cy={60} r={40} stroke="#566551" strokeWidth={7} strokeLinecap="round" strokeDasharray="188" strokeDashoffset={53} transform="rotate(-90 80 60)" />
        <SvgText x={80} y={56} textAnchor="middle" fill="#1E293B" fontSize={16} fontWeight="700">72%</SvgText>
        <SvgText x={80} y={68} textAnchor="middle" fill="#566551" fontSize={8}>Complete</SvgText>
        <Rect x={14} y={26} width={36} height={14} rx={7} fill="#DCFCE7" />
        <SvgText x={32} y={35} textAnchor="middle" fill="#16A34A" fontSize={7} fontWeight="600">Done ✓</SvgText>
        <Rect x={110} y={26} width={42} height={14} rx={7} fill="#C5D5E4" />
        <SvgText x={131} y={35} textAnchor="middle" fill="#1E293B" fontSize={7} fontWeight="600">In Progress</SvgText>
        <Rect x={14} y={84} width={40} height={14} rx={7} fill="#FEE2E2" />
        <SvgText x={34} y={93} textAnchor="middle" fill="#DC2626" fontSize={7} fontWeight="600">High ↑</SvgText>
        <Rect x={108} y={84} width={42} height={14} rx={7} fill="#FEF3C7" />
        <SvgText x={129} y={93} textAnchor="middle" fill="#D97706" fontSize={7} fontWeight="600">Aug 12</SvgText>
      </Svg>
    ),
  },
];

export default function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
            <Text style={styles.logoText}>Kora</Text>
            <TouchableOpacity onPress={onDone} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
            <Text style={styles.stepText}>{current.num} / 03</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationCard}>
            {current.illustration}
        </View>

        {/* Main Text Content */}
        <View style={styles.content}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.subTitle}>{current.sub}</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomSection}>
            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
                <TouchableOpacity
                key={i}
                onPress={() => setStep(i)}
                style={[
                    styles.dot,
                    {
                    width: i === step ? 24 : 8,
                    backgroundColor: i === step ? '#566551' : '#C5D5E4',
                    },
                ]}
                />
            ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
            {step > 0 && (
                <TouchableOpacity
                onPress={() => setStep(s => s - 1)}
                style={styles.backButton}
                >
                <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={() => (isLast ? onDone() : setStep(s => s + 1))}
                activeOpacity={0.8}
                style={styles.nextButton}
            >
                <Text style={styles.nextButtonText}>
                {isLast ? 'Get Started →' : 'Continue →'}
                </Text>
            </TouchableOpacity>
            </View>
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
    backgroundColor: '#F8F9FA',
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#566551',
  },
  skipButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C5D5E4',
    letterSpacing: 1.5,
  },
  illustrationCard: {
    marginHorizontal: 20,
    backgroundColor: '#C5D5E4',
    height: 208,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#1E293B',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#566551',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#566551',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});