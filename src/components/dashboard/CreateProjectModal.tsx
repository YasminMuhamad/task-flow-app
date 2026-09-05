import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { sendNotification } from '../../services/notificationService';
import { BlurView } from 'expo-blur';

interface UserMember {
  uid: string;
  fullName: string;
  email: string;
}

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
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

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
  onProjectCreated,
}) => {
  const { user, getInitials, profileData } = useApp();
  const { colors, isDark } = useTheme();

  const PROJECT_TAGS = ['Design', 'Engineering', 'Marketing', 'General'];

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tag, setTag] = useState('Design');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState<UserMember | null>(null); 
  const [selectedMembers, setSelectedMembers] = useState<UserMember[]>([]);

  const handleClose = () => {
    setTitle('');
    setDesc('');
    setError(null);
    setMemberError(null);
    setTag('Design');
    setShowEmailInput(false);
    setSearchEmail('');
    setSuggestedUser(null);
    setSelectedMembers([]);
    onClose();
  };

  const handleSearchEmail = async (text: string) => {
    setSearchEmail(text);
    setMemberError(null);
    setSuggestedUser(null);

    const cleanEmail = text.trim().toLowerCase();
    if (!cleanEmail || cleanEmail.length < 3) return; 

    if (user && user.email?.toLowerCase() === cleanEmail) {
      setMemberError('You are already the project creator.');
      return;
    }

    if (selectedMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setMemberError('This user is already added.');
      return;
    }

    setSearchingUser(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSuggestedUser(null);
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (!selectedMembers.some((m) => m.uid === userDoc.id)) {
          setSuggestedUser({
            uid: userDoc.id,
            fullName: userData.fullName || 'User',
            email: userData.email,
          });
        }
      }
    } catch (err: any) {
      console.error('Error searching user:', err);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSelectSuggestedUser = (selectedUser: UserMember) => {
    setSelectedMembers((prev) => [...prev, selectedUser]);
    setSearchEmail('');
    setSuggestedUser(null);
    setMemberError(null);
  };

  const handleRemoveMember = (uid: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.uid !== uid));
  };

  const handleCreate = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a project.');
      return;
    }

    setLoading(true);
    try {
      const senderName = profileData?.fullName || user.email || 'Someone';

      const memberIds = Array.from(
        new Set([user.uid, ...selectedMembers.map((m) => m.uid)])
      );

      const projectDocRef = await addDoc(collection(db, 'projects'), {
        title: title.trim(),
        desc: desc.trim() || '',
        tag: tag,
        progress: 0,
        memberIds: memberIds,
        tasks: {
          total: 0,
          done: 0,
        },
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      for (const member of selectedMembers) {
        await sendNotification({
          recipientId: member.uid,
          senderId: user.uid,
          type: 'invite',
          text: `${senderName} added you to project "${title.trim()}"`,
          projectId: projectDocRef.id,
        });
      }

      handleClose();
      onProjectCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={RNStyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
              {/* Drag Handle */}
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Project</Text>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Title Input */}
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Project Title *"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (error) setError(null);
                  }}
                />

                {/* Description Input */}
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Description (Optional)"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={desc}
                  onChangeText={(text) => {
                    setDesc(text);
                    if (error) setError(null);
                  }}
                />

                {/* Tag Selection */}
                <View style={styles.tagRow}>
                  {PROJECT_TAGS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.tagChip,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        tag === t && [styles.activeTagChip, { backgroundColor: colors.primary, borderColor: colors.primary }],
                      ]}
                      onPress={() => setTag(t)}
                    >
                      <Text style={[styles.tagText, { color: colors.textMuted }, tag === t && styles.activeTagText]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Add Team Members Header */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Team Members</Text>
                  <TouchableOpacity
                    style={[styles.addCircleBtn, { borderColor: colors.primary, backgroundColor: colors.card }]}
                    onPress={() => {
                      setShowEmailInput(!showEmailInput);
                      setMemberError(null);
                      setSuggestedUser(null);
                    }}
                  >
                    <Text style={[styles.addCircleText, { color: colors.primary }]}>{showEmailInput ? '✕' : '+'}</Text>
                  </TouchableOpacity>
                </View>

                {showEmailInput && (
                  <View style={styles.emailContainer}>
                    <View style={styles.emailSearchRow}>
                      <TextInput
                        style={[styles.input, styles.emailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        placeholder="Type user email..."
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={searchEmail}
                        onChangeText={handleSearchEmail}
                      />
                      {searchingUser && (
                        <ActivityIndicator
                          color={colors.primary}
                          size="small"
                          style={styles.searchLoader}
                        />
                      )}
                    </View>

                    {suggestedUser && (
                      <TouchableOpacity
                        style={[styles.suggestionCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => handleSelectSuggestedUser(suggestedUser)}
                      >
                        <View
                          style={[
                            styles.suggestionAvatar,
                            { backgroundColor: getMemberColor(suggestedUser.uid) },
                          ]}
                        >
                          <Text style={styles.avatarText}>{getInitials(suggestedUser.fullName)}</Text>
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={[styles.suggestionName, { color: colors.text }]}>{suggestedUser.fullName}</Text>
                          <Text style={[styles.suggestionEmail, { color: colors.textMuted }]}>{suggestedUser.email}</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {memberError && <Text style={styles.memberErrorText}>{memberError}</Text>}
                  </View>
                )}

                {/* Selected Members Avatars */}
                {selectedMembers.length > 0 && (
                  <View style={styles.membersRow}>
                    {selectedMembers.map((member) => {
                      const avatarBg = getMemberColor(member.uid);
                      const initials = getInitials(member.fullName);

                      return (
                        <View key={member.uid} style={styles.avatarWrapper}>
                          <View style={[styles.avatarCircle, { backgroundColor: avatarBg, borderColor: colors.card }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeBadgeBtn}
                            onPress={() => handleRemoveMember(member.uid)}
                          >
                            <Text style={styles.removeBadgeText}>x</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.toggleBg }]} onPress={handleClose}>
                    <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.disabledBtn]}
                    onPress={handleCreate}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </BlurView>
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
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    // maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  activeTagChip: {
    // Overwritten dynamically
  },
  tagText: {
    fontSize: 12,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  addCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleText: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  emailContainer: {
    marginBottom: 12,
  },
  emailSearchRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  emailInput: {
    marginBottom: 0,
    paddingRight: 40,
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  suggestionEmail: {
    fontSize: 11,
  },
  memberErrorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  avatarWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeBadgeBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E53E3E',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelText: {
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});