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
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { COLORS } from '../constants/theme';
import { TaskPriority, TaskStatus } from '../types/task';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const getMemberColor = (str: string) => {
  const colors = ['#566551', '#C5D5E4', '#8DA68A', '#A8BECE', '#3F4B3C'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  projectId,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDateText, setDueDateText] = useState('2025-08-20');
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

          // setting the first member as default assignee if available
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

  // reset form fields when modal is closed
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

  // save task to Firestore
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

      // convert dueDateText to a valid Date object
      const finalDueDate = dueDate || new Date();
      
      const newTaskData = {
        projectId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || currentUser?.uid || '',
        dueDate: Timestamp.fromDate(finalDueDate),
        priority,
        status: 'todo' as TaskStatus,
        overdue: false,
        createdBy: currentUser?.uid || '',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'tasks'), newTaskData);

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          {/* Backdrop Touch Area */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            {/* Sheet Container */}
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Create Task</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <Path
                      d="M3 3l8 8M11 3l-8 8"
                      stroke={COLORS.muted}
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
              >
                {/* Task Title */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Task Title *</Text>
                  <TextInput
                    placeholder="e.g. Finalize icon set for v2.0"
                    placeholderTextColor="#94A3B8"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                  />
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    placeholder="Add context, links, or notes for the team..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                {/* Assign To */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Assign To</Text>
                  {loadingMembers ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                  ) : members.length === 0 ? (
                    <Text style={styles.emptyMembersText}>No members found in this project</Text>
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
                                  isSelected && styles.avatarSelected,
                                ]}
                              >
                                <Text style={styles.avatarText}>{m.initials}</Text>
                              </View>
                              <Text
                                style={[
                                  styles.memberName,
                                  isSelected && styles.memberNameSelected,
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
                  <Text style={styles.label}>Due Date</Text>
                  
                  <TouchableOpacity
                    style={styles.dateSelector}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
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
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.priorityRow}>
                    {/* Low */}
                    <TouchableOpacity
                      style={[
                        styles.priorityBtn,
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
                  style={[styles.saveButton, loading && styles.disabledBtn]}
                  activeOpacity={0.8}
                  onPress={handleSaveTask}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Task</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxHeight: '88%',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
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
    color: COLORS.text,
  },
  closeButton: {
    padding: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
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
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
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
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  memberName: {
    fontSize: 11,
    color: COLORS.muted,
  },
  memberNameSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyMembersText: {
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  dateSelector: {
  backgroundColor: '#F8F9FA', // أو استخدم COLORS.bg
  borderWidth: 1,
  borderColor: '#E2E8F0',     // أو استخدم COLORS.border
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  justifyContent: 'center',
},
dateText: {
  fontSize: 14,
  color: '#1E293B',           // أو استخدم COLORS.text
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
});