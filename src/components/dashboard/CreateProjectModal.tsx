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
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../api/firebase';
import { COLORS } from '../../constants/theme';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
  onProjectCreated,
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tag, setTag] = useState('Design');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form fields when closing
  const handleClose = () => {
    setTitle('');
    setDesc('');
    setError(null);
    setTag('Design');
    onClose();
  };

  const handleCreate = async () => {
    setError(null);

    // 1. Validate mandatory input
    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }

    // 2. Ensure current user session exists
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('You must be logged in to create a project.');
      return;
    }

    setLoading(true);
    try {
      // 3. Save matching exact Firestore schema / Project interface
      await addDoc(collection(db, 'projects'), {
        title: title.trim(),
        desc: desc.trim() || '',
        tag: tag,
        progress: 0,
        memberIds: [currentUser.uid],
        tasks: { 
          total: 0, 
          done: 0 
        },
        createdBy: currentUser.uid,
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
              <Text style={styles.modalTitle}>Create New Project</Text>

              {/* Error Banner */}
              {error && <Text style={styles.errorText}>{error}</Text>}

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

              {/* Tag selection */}
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

              {/* Action buttons */}
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
    height: 80,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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