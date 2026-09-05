import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { Task } from '../types/task';
import { Project } from '../types/project';
import { useTheme } from '../context/ThemeContext';

interface Props {
  project: Project;
  onBack: () => void;
  onTaskSelect?: (taskId: string) => void;
}

const PRIORITY_CFG: Record<string, { bg: string; text: string }> = {
  High: { bg: '#FEE2E2', text: '#DC2626' },
  Med: { bg: '#FEF3C7', text: '#D97706' },
  Low: { bg: '#DCFCE7', text: '#16A34A' },
};

export default function ArchivedTasksScreen({ project, onBack, onTaskSelect }: Props) {
  const { colors, isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!project?.id) return;

    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', project.id),
      where('archived', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks: Task[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Task[];
        setTasks(fetchedTasks);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching archived tasks: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [project?.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const restoreTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { archived: false });
      showToast('Task restored to active list ✓');
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const deletePermanently = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      setConfirmDeleteId(null);
      showToast('Task permanently deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const formatDate = (dateField: Timestamp | Date | undefined) => {
    if (!dateField) return 'N/A';
    const date = dateField instanceof Timestamp ? dateField.toDate() : new Date(dateField);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M10 4L6 8l4 4" stroke={colors.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Archived Tasks</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>Project: {project?.title || 'General'}</Text>
          </View>

          <View style={[styles.archiveBadge, { backgroundColor: colors.toggleBg }]}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Rect x="1.5" y="3" width="13" height="3" rx="1.2" stroke={colors.primary} strokeWidth="1.3" />
              <Path d="M2.5 6v6.5a1 1 0 001 1h9a1 1 0 001-1V6" stroke={colors.primary} strokeWidth="1.3" strokeLinecap="round" />
              <Path d="M6 9.5h4" stroke={colors.primary} strokeWidth="1.3" strokeLinecap="round" />
            </Svg>
          </View>
        </View>

        {tasks.length > 0 && (
          <View style={styles.taskCountRow}>
            <View style={[styles.pillCount, { backgroundColor: colors.toggleBg }]}>
              <Text style={[styles.pillCountText, { color: colors.primary }]}>
                {tasks.length} archived {tasks.length === 1 ? 'task' : 'tasks'}
              </Text>
            </View>
            <Text style={[styles.countDesc, { color: colors.textMuted }]}>Restore or delete permanently</Text>
          </View>
        )}
      </View>

      {/* Toast Notification */}
      {toast && (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: toast.includes('deleted') ? (isDark ? '#451A03' : '#FEE2E2') : (isDark ? '#064E3B' : '#DCFCE7'),
              borderColor: toast.includes('deleted') ? '#FCA5A5' : '#86EFAC',
            },
          ]}
        >
          {toast.includes('deleted') ? (
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path d="M2.5 4h9M5.5 2.5h3M4 4l.5 7a1 1 0 001 .5h3a1 1 0 001-.5L10 4" stroke="#DC2626" strokeWidth="1.3" strokeLinecap="round" />
            </Svg>
          ) : (
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path d="M2.5 7l3 3 6-6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
          <Text style={[styles.toastText, { color: toast.includes('deleted') ? '#DC2626' : '#16A34A' }]}>
            {toast}
          </Text>
        </View>
      )}

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.toggleBg }]}>
                <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <Rect x="6" y="12" width="36" height="8" rx="4" stroke={colors.primary} strokeWidth="2" />
                  <Path d="M8 20v18a3 3 0 003 3h26a3 3 0 003-3V20" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                  <Path d="M18 30h12" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Tasks</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Tasks you archive from this project will appear here.</Text>
            </View>
          ) : (
            tasks.map((task) => {
              const pc = PRIORITY_CFG[task.priority] || PRIORITY_CFG['Low'];
              return (
                <TouchableOpacity
                  key={task.id}
                  activeOpacity={0.9}
                  onPress={() => onTaskSelect && onTaskSelect(task.id)}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{task.title}</Text>
                    <View style={[styles.archivedTag, { backgroundColor: colors.toggleBg }]}>
                      <Svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <Rect x="0.5" y="1.5" width="8" height="6" rx="1.2" stroke={colors.primary} strokeWidth="1" />
                        <Path d="M1 3.5h7" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" />
                      </Svg>
                      <Text style={[styles.archivedTagText, { color: colors.primary }]}>Archived</Text>
                    </View>
                  </View>

                  {/* Meta Info */}
                  <View style={styles.metaRow}>
                    <View style={[styles.dateBadge, { backgroundColor: colors.toggleBg }]}>
                      <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <Rect x="1" y="1.5" width="8" height="7.5" rx="1.5" stroke={colors.textMuted} strokeWidth="1" />
                        <Path d="M3.5 1v1.5M6.5 1v1.5M1 4h8" stroke={colors.textMuted} strokeWidth="1" strokeLinecap="round" />
                      </Svg>
                      <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(task.dueDate)}</Text>
                    </View>

                    <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
                      <Text style={[styles.priorityText, { color: pc.text }]}>{task.priority}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.restoreBtn, { borderColor: colors.primary, backgroundColor: colors.card }]}
                      onPress={() => restoreTask(task.id)}
                    >
                      <Svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <Path d="M2 5.5A4.5 4.5 0 1111 7M2 2v3.5h3.5" stroke={colors.primary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={[styles.restoreText, { color: colors.primary }]}>Restore Task</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => setConfirmDeleteId(task.id)}
                    >
                      <Svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <Path d="M2 3.5h9M5 2h3M4.5 3.5l.5 6.5a1 1 0 001 .5h2a1 1 0 001-.5l.5-6.5" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal Confirm Delete */}
      <Modal
        visible={confirmDeleteId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmDeleteId(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setConfirmDeleteId(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.deleteIconBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M10 11v6M14 11v6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
              </Svg>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Permanently?</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              This task and all its data will be removed forever. This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.toggleBg }]}
                onPress={() => setConfirmDeleteId(null)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => confirmDeleteId && deletePermanently(confirmDeleteId)}
              >
                <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1.5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSub: { fontSize: 12, marginTop: 2 },
  archiveBadge: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  pillCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillCountText: { fontSize: 12, fontWeight: '600' },
  countDesc: { fontSize: 12 },
  toast: { marginHorizontal: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5 },
  toastText: { fontSize: 13, fontWeight: '600' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyIconBox: { width: 100, height: 88, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  emptySub: { fontSize: 14, textAlign: 'center', maxWidth: 240 },
  card: { borderRadius: 24, padding: 16, opacity: 0.95 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  archivedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  archivedTagText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  dateText: { fontSize: 11, fontWeight: '500' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  restoreBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  restoreText: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#FCA5A5' },
  deleteText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,41,59,0.4)' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  deleteIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  modalSub: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#EF4444', alignItems: 'center' },
  confirmDeleteText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});