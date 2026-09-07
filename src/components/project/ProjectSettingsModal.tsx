import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Project } from '../../types/project';
import { SearchedUser } from '../../hooks/useProjectDetails';
import { BlurView } from 'expo-blur';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentProject: Project;
  activeTab: 'general' | 'members';
  setActiveTab: (tab: 'general' | 'members') => void;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editTag: string;
  setEditTag: (val: string) => void;
  isOwner: boolean;
  user: any;
  usersMap: Record<string, any>;
  selectedNewOwner: string | null;
  setSelectedNewOwner: (id: string | null) => void;
  isTransferring: boolean;
  handleTransferOwnership: () => void;
  isUpdating: boolean;
  handleUpdateProject: () => void;
  searchEmail: string;
  setSearchEmail: (val: string) => void;
  searching: boolean;
  notFound: boolean;
  foundUser: SearchedUser | null;
  memberActionLoading: boolean;
  handleAddMember: (id: string) => void;
  setMemberToDelete: (member: { id: string; name: string } | null) => void;
}

export const ProjectSettingsModal = ({
  visible,
  onClose,
  currentProject,
  activeTab,
  setActiveTab,
  editTitle,
  setEditTitle,
  editTag,
  setEditTag,
  isOwner,
  user,
  usersMap,
  selectedNewOwner,
  setSelectedNewOwner,
  isTransferring,
  handleTransferOwnership,
  isUpdating,
  handleUpdateProject,
  searchEmail,
  setSearchEmail,
  searching,
  notFound,
  foundUser,
  memberActionLoading,
  handleAddMember,
  setMemberToDelete,
}: Props) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView style={styles.modalOverlay}>
        <TouchableOpacity style={RNStyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          {/* Drag Handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Project Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Segmented Control / Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.toggleBg }]}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'general' && [styles.activeTabButton, { backgroundColor: colors.card }]]}
              onPress={() => setActiveTab('general')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'general' && [styles.activeTabText, { color: colors.primary }]]}>
                General
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'members' && [styles.activeTabButton, { backgroundColor: colors.card }]]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'members' && [styles.activeTabText, { color: colors.primary }]]}>
                Members ({currentProject.memberIds?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: General Settings & Transfer Ownership */}
          {activeTab === 'general' ? (
            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Title</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Project Title"
                placeholderTextColor={colors.textMuted}
                editable={isOwner}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Tag</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={editTag}
                onChangeText={setEditTag}
                placeholder="Tag (e.g., Mobile, Web)"
                placeholderTextColor={colors.textMuted}
                editable={isOwner}
              />

              {isOwner && (
                <View style={[styles.transferSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.dangerZoneTitle, { color: colors.danger }]}>Transfer Ownership</Text>
                  <Text style={[styles.dangerZoneSubtext, { color: colors.textMuted }]}>
                    Select a team member to take full ownership of this project.
                  </Text>

                  <ScrollView style={[styles.ownerPickerList, { borderColor: colors.border }]} nestedScrollEnabled>
                    {currentProject.memberIds
                      ?.filter((uid) => uid !== user?.uid)
                      .map((uid) => {
                        const info = usersMap[uid];
                        const name = info?.fullName || 'User';
                        const email = info?.email || '';
                        const isSelected = selectedNewOwner === uid;

                        return (
                          <TouchableOpacity
                            key={uid}
                            style={[styles.ownerSelectRow, { backgroundColor: colors.background }, isSelected && [styles.ownerSelectRowActive, { backgroundColor: colors.toggleBg, borderColor: colors.primary }]]}
onPress={() => {
    setSelectedNewOwner(uid);
  }}                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[styles.memberName, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: '700' }]}
                              >
                                {name}
                              </Text>
                              {email ? <Text style={[styles.selectEmail, { color: colors.textMuted }]}>{email}</Text> : null}
                            </View>
                            {isSelected && <View style={[styles.radioSelectedDot, { backgroundColor: colors.primary }]} />}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>

                  {selectedNewOwner && (
                    <TouchableOpacity
                      style={[styles.dialogBtn, styles.transferBtn, { backgroundColor: colors.danger }]}
                      onPress={() => {
      handleTransferOwnership();
    }}
                      disabled={isTransferring}
                    >
                      {isTransferring ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={[styles.transferBtnText, { color: '#fff' }]}>Confirm Transfer to Selected Member</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={[styles.dialogActions, { marginTop: 20 }]}>
                <TouchableOpacity
                  style={[styles.dialogBtn, { backgroundColor: colors.toggleBg }]}
                  onPress={onClose}
                  disabled={isUpdating}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dialogBtn, { backgroundColor: colors.primary }]}
                  onPress={handleUpdateProject}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.saveBtnText, { color: '#fff' }]}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Tab 2: Manage Members */
            <View style={{ flex: 1, marginTop: 12 }}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Search by Email</Text>
              <View style={styles.searchBoxContainer}>
                <TextInput
                  style={[styles.modalInputSearch, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={searchEmail}
                  onChangeText={setSearchEmail}
                  placeholder="Enter user email..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />}
              </View>

              {notFound && <Text style={[styles.notFoundText, { color: colors.danger }]}>User not found</Text>}

              {foundUser && (
                <View style={[styles.selectCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectName, { color: colors.text }]}>{foundUser.name}</Text>
                    <Text style={[styles.selectEmail, { color: colors.textMuted }]}>{foundUser.email}</Text>
                  </View>
                  {currentProject.memberIds?.includes(foundUser.id) ? (
                    <Text style={[styles.alreadyAddedText, { color: colors.textMuted }]}>Already added</Text>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addMemberBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleAddMember(foundUser.id)}
                      disabled={memberActionLoading}
                    >
                      {memberActionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.addMemberBtnText, { color: '#fff' }]}>Add</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: 16, color: colors.textMuted }]}>Project Members</Text>
              <ScrollView style={styles.membersListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {currentProject.memberIds?.map((uid) => {
                  const info = usersMap[uid];
                  const name = info?.fullName || 'User';
                  const email = info?.email || '';
                  const isThisMemberOwner = uid === currentProject.createdBy;
                  const initials = name.slice(0, 2).toUpperCase();

                  return (
                    <View key={uid} style={[styles.memberCardRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.avatarText, { color: '#fff' }]}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {name} {isThisMemberOwner ? '(Owner)' : ''}
                        </Text>
                        {email ? <Text style={[styles.selectEmail, { color: colors.textMuted }]}>{email}</Text> : null}
                      </View>

                      {isOwner && !isThisMemberOwner && (
                        <TouchableOpacity
                          onPress={() => setMemberToDelete({ id: uid, name })}
                          style={styles.removeMemberBtn}
                        >
                          <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <Path d="M3 3l8 8M11 3l-8 8" stroke={colors.danger} strokeWidth="1.8" strokeLinecap="round" />
                          </Svg>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.dialogActions}>
                <TouchableOpacity style={[styles.dialogBtn, { backgroundColor: colors.toggleBg }]} onPress={onClose}>
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30,41,59,0.5)',
  },
  modalSheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '85%',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeIconBtn: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  transferSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dangerZoneSubtext: {
    fontSize: 12,
    marginBottom: 10,
  },
  ownerPickerList: {
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
  },
  ownerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  ownerSelectRowActive: {
    borderWidth: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectEmail: {
    fontSize: 11,
  },
  radioSelectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  transferBtn: {
    marginTop: 4,
  },
  transferBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  dialogBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  searchBoxContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  modalInputSearch: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 36,
    fontSize: 14,
  },
  searchSpinner: {
    position: 'absolute',
    right: 10,
  },
  notFoundText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  selectName: {
    fontSize: 14,
    fontWeight: '600',
  },
  alreadyAddedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addMemberBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMemberBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  membersListScroll: {
    maxHeight: 180,
    marginTop: 4,
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  removeMemberBtn: {
    padding: 6,
  },
});