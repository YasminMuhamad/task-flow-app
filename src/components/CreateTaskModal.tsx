import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getInitials, getMemberColor } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { TaskPriority, TaskStatus } from '../types/task';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sendNotification } from '../services/notificationService';
import { BlurView } from 'expo-blur';

interface CreateTaskModalProps {
  visible: boolean;
  projectId: string;
  onClose: () => void;
  onTaskCreated?: () => void;
}

interface MemberUser {
  id: string; // uid
  name: string;
  initials: string;
  color: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  projectId,
  onClose,
  onTaskCreated,
}) => {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('Med');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false); 
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId || !visible) return;

      setLoadingMembers(true);
      try {
        const projectDocRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectDocRef);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          const memberIds: string[] = projectData.memberIds || [];

          const fetchedMembers: MemberUser[] = [];
          for (const uid of memberIds) {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              const fullName = uData.fullName || uData.email || 'User';
              fetchedMembers.push({
                id: uid,
                name: fullName.split(' ')[0],
                initials: getInitials(fullName),
                color: getMemberColor(uid),
              });
            }
          }

          setMembers(fetchedMembers);

          if (fetchedMembers.length > 0) {
            setAssigneeId(fetchedMembers[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching project members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchProjectMembers();
  }, [projectId, visible]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError(null);
    setPriority('Med');
    if (members.length > 0) {
      setAssigneeId(members[0].id);
    } else {
      setAssigneeId('');
    }
    onClose();
  };

  const handleSaveTask = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    if (!projectId) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user');

      const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserProfile = userDocSnap.exists() ? userDocSnap.data() : null;
      const senderName = currentUserProfile?.fullName || currentUser.email || 'Someone';

      const finalDueDate = dueDate || new Date();
      const targetAssigneeId = assigneeId || currentUser.uid;
      
      const newTaskData = {
        projectId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: targetAssigneeId,
        dueDate: Timestamp.fromDate(finalDueDate),
        priority,
        status: 'todo' as TaskStatus,
        overdue: false,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTaskData);

      if (targetAssigneeId !== currentUser.uid) {
        await sendNotification({
          recipientId: targetAssigneeId,
          senderId: currentUser.uid,
          type: 'task',
          text: `${senderName} assigned you to "${title.trim()}"`,
          projectId: projectId,
          taskId: docRef.id,
        });
      }

      setLoading(false);
      handleClose();

      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
        <TouchableOpacity style={RNStyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Sheet Container */}
          <View style={[styles.sheetContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Create Task</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <Path
                    d="M3 3l8 8M11 3l-8 8"
                    stroke={colors.textMuted}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Form Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
            >
              {/* Task Title */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Task Title *</Text>
                <TextInput
                  placeholder="e.g. Finalize icon set for v2.0"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                />
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                <TextInput
                  placeholder="Add context, links, or notes for the team..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                />
              </View>

              {/* Assign To */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Assign To</Text>
                {loadingMembers ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                ) : members.length === 0 ? (
                  <Text style={[styles.emptyMembersText, { color: colors.textMuted }]}>No members found in this project</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.membersRow}>
                      {members.map((m) => {
                        const isSelected = assigneeId === m.id;
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={styles.memberItem}
                            activeOpacity={0.7}
                            onPress={() => setAssigneeId(m.id)}
                          >
                            <View
                              style={[
                                styles.avatar,
                                { backgroundColor: m.color },
                                isSelected && [styles.avatarSelected, { borderColor: colors.primary }],
                              ]}
                            >
                              <Text style={styles.avatarText}>{m.initials}</Text>
                            </View>
                            <Text
                              style={[
                                styles.memberName,
                                { color: colors.textMuted },
                                isSelected && [styles.memberNameSelected, { color: colors.primary }],
                              ]}
                            >
                              {m.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>

              {/* Due Date */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
                
                <TouchableOpacity
                  style={[styles.dateSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {dueDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()} 
                    onChange={handleDateChange}
                  />
                )}
              </View>

              {/* Priority */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
                <View style={styles.priorityRow}>
                  {/* Low */}
                  <TouchableOpacity
                    style={[
                      styles.priorityBtn,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      priority === 'Low' && styles.priorityLowActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setPriority('Low')}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priority === 'Low' ? '#FFFFFF' : '#16A34A' },
                      ]}
                    >
                      Low
                    </Text>
                  </TouchableOpacity>

                  {/* Medium */}
                  <TouchableOpacity
                    style={[
                      styles.priorityBtn,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      priority === 'Med' && styles.priorityMediumActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setPriority('Med')}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priority === 'Med' ? '#FFFFFF' : '#D97706' },
                      ]}
                    >
                      Medium
                    </Text>
                  </TouchableOpacity>

                  {/* High */}
                  <TouchableOpacity
                    style={[
                      styles.priorityBtn,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      priority === 'High' && styles.priorityHighActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setPriority('High')}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priority === 'High' ? '#FFFFFF' : '#DC2626' },
                      ]}
                    >
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }, loading && styles.disabledBtn]}
                activeOpacity={0.8}
                onPress={handleSaveTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Task</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxHeight: '88%',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'left',
  },
  formContainer: {
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  membersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  memberItem: {
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarSelected: {
    borderWidth: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  memberName: {
    fontSize: 11,
  },
  memberNameSelected: {
    fontWeight: 'bold',
  },
  emptyMembersText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dateSelector: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  priorityLowActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  priorityMediumActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  priorityHighActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});