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
} from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';

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
  const { user, getInitials } = useApp();

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
      const memberIds = Array.from(
        new Set([user.uid, ...selectedMembers.map((m) => m.uid)])
      );

      await addDoc(collection(db, 'projects'), {
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.container}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Create New Project</Text>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Title Input */}
                <TextInput
                  style={styles.input}
                  placeholder="Project Title *"
                  placeholderTextColor={COLORS.muted}
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (error) setError(null);
                  }}
                />

                {/* Description Input */}
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (Optional)"
                  placeholderTextColor={COLORS.muted}
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
                  {['Design', 'Engineering', 'Marketing'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tagChip, tag === t && styles.activeTagChip]}
                      onPress={() => setTag(t)}
                    >
                      <Text style={[styles.tagText, tag === t && styles.activeTagText]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Add Team Members Header */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Add Team Members</Text>
                  <TouchableOpacity
                    style={styles.addCircleBtn}
                    onPress={() => {
                      setShowEmailInput(!showEmailInput);
                      setMemberError(null);
                      setSuggestedUser(null);
                    }}
                  >
                    <Text style={styles.addCircleText}>{showEmailInput ? '✕' : '+'}</Text>
                  </TouchableOpacity>
                </View>

                {showEmailInput && (
                  <View style={styles.emailContainer}>
                    <View style={styles.emailSearchRow}>
                      <TextInput
                        style={[styles.input, styles.emailInput]}
                        placeholder="Type user email..."
                        placeholderTextColor={COLORS.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={searchEmail}
                        onChangeText={handleSearchEmail}
                      />
                      {searchingUser && (
                        <ActivityIndicator
                          color={COLORS.primary}
                          size="small"
                          style={styles.searchLoader}
                        />
                      )}
                    </View>

                    {suggestedUser && (
                      <TouchableOpacity
                        style={styles.suggestionCard}
                        onPress={() => handleSelectSuggestedUser(suggestedUser)}
                      >
                        <View
                          style={[
                            styles.suggestionAvatar,
                            { backgroundColor: getMemberColor(suggestedUser.uid) },
                          ]}
                        >
                          {/* 👈 استخدام getInitials الجاهزة */}
                          <Text style={styles.avatarText}>{getInitials(suggestedUser.fullName)}</Text>
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionName}>{suggestedUser.fullName}</Text>
                          <Text style={styles.suggestionEmail}>{suggestedUser.email}</Text>
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
                      // 👈 استخدام getInitials الجاهزة
                      const initials = getInitials(member.fullName);

                      return (
                        <View key={member.uid} style={styles.avatarWrapper}>
                          <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
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
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.disabledBtn]}
                    onPress={handleCreate}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.submitText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    maxHeight: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
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
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTagChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  activeTagText: {
    color: COLORS.white,
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
    color: COLORS.text,
  },
  addCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleText: {
    color: COLORS.primary,
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: COLORS.text,
  },
  suggestionEmail: {
    fontSize: 11,
    color: COLORS.muted,
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
    borderColor: COLORS.bg,
  },
  avatarText: {
    color: COLORS.white,
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
    borderWidth: 1,
    borderColor: COLORS.bg,
  },
  removeBadgeText: {
    color: COLORS.white,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});