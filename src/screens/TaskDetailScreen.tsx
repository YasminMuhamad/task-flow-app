import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useAppContext } from "../context/AppContext";

// Custom Hook & Helpers
import { useTaskDetails } from "../hooks/useTaskDetails";
import { formatDate } from "../utils/taskHelpers";

// Refactored Components
import { TaskHeader } from "../components/task-detail/TaskHeader";
import { TaskMetaBar } from "../components/task-detail/TaskMetaBar";
import { TaskChecklist } from "../components/task-detail/TaskChecklist";
import { TaskAttachments } from "../components/task-detail/TaskAttachments";
import { TaskComments } from "../components/task-detail/TaskComments";
import { useTheme } from "../context/ThemeContext";
import { BlurView } from 'expo-blur';

interface Props {
  onBack?: () => void;
  taskId: string;
}

export default function TaskDetailScreen({ onBack, taskId }: Props) {
  const insets = useSafeAreaInsets();
  const { usersMap, getInitials, profileData, getMemberColor } = useAppContext();
  const { colors, isDark } = useTheme();

  const {
    task,
    checklist,
    comments,
    attachments,
    loading,
    errorMsg,
    newChecklistItem,
    setNewChecklistItem,
    newComment,
    submittingComment,
    uploadingFile,
    isEditModalVisible,
    setIsEditModalVisible,
    editTitle,
    setEditTitle,
    editDesc,
    setEditDesc,
    updatingTask,
    isArchiveModalVisible,
    setIsArchiveModalVisible,
    archivingTask,
    showMentionsList,
    assignee,
    currentProjectObj,
    projectMemberIds,
    filteredMembersToMention,
    toggleChecklistItem,
    handleAddChecklistItem,
    handleCommentChange,
    handleSelectUserToMention,
    handleAddComment,
    handleUploadAttachment,
    handleCycleStatus,
    handleCyclePriority,
    handleSaveTaskEdits,
    handleArchiveTask,
  } = useTaskDetails(taskId, onBack);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (errorMsg || !task) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg || "Task unavailable"}</Text>
        {onBack && (
          <TouchableOpacity style={[styles.backBtnInline, { backgroundColor: colors.primary }]} onPress={onBack}>
            <Text style={[styles.backBtnText, { color: colors.white }]}>Go Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const projectName = currentProjectObj?.title || `Project #${task?.projectId}`;
  const doneCount = checklist.filter((c) => c.done).length;
  const pct =
    checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.primary} />

        {/* 1. Header Component */}
        <TaskHeader
          projectName={projectName}
          onBack={onBack}
          onOpenEdit={() => setIsEditModalVisible(true)}
          onOpenArchive={() => setIsArchiveModalVisible(true)}
        />

        {/* Main Scrollable Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Meta Bar & Title Component */}
          <TaskMetaBar
            task={task}
            assignee={assignee}
            getInitials={getInitials}
            getMemberColor={getMemberColor}
            formatDate={formatDate}
            onCycleStatus={handleCycleStatus}
            onCyclePriority={handleCyclePriority}
          />

          {/* Description Section */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DESCRIPTION</Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {task.description || "No description provided."}
            </Text>
          </View>

          {/* 3. Checklist Component */}
          <TaskChecklist
            checklist={checklist}
            doneCount={doneCount}
            pct={pct}
            newChecklistItem={newChecklistItem}
            setNewChecklistItem={setNewChecklistItem}
            onToggleItem={toggleChecklistItem}
            onAddItem={handleAddChecklistItem}
          />

          {/* 4. Attachments Component */}
          <TaskAttachments
            attachments={attachments}
            uploadingFile={uploadingFile}
            onUpload={handleUploadAttachment}
          />

          {/* 5. Comments & Activity Component */}
          <TaskComments
            comments={comments}
            usersMap={usersMap}
            projectMemberIds={projectMemberIds}
            getInitials={getInitials}
            getMemberColor={getMemberColor}
          />
        </ScrollView>

        {/* Mentions Dropdown List */}
        {showMentionsList && filteredMembersToMention.length > 0 && (
  <View style={[styles.mentionsDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
    {filteredMembersToMention.map((member: any) => (
      <TouchableOpacity
        key={member.uid}
        style={[styles.mentionItem, { backgroundColor: colors.card }]}
        onPress={() => handleSelectUserToMention(member.fullName)}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: getMemberColor(member.uid), width: 24, height: 24 },
          ]}
        >
          <Text style={[styles.avatarText, { fontSize: 8, color: colors.white }]}>
            {getInitials(member.fullName)}
          </Text>
        </View>
        <Text style={[styles.mentionItemText, { color: colors.text }]}>{member.fullName}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}

        {/* Bottom Comment Input Bar */}
<View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>    
  <View style={[styles.avatar, { backgroundColor: profileData?.uid ? getMemberColor(profileData.uid) : colors.primary }]}>
    <Text style={[styles.avatarText, { color: colors.white }]}>
      {getInitials(profileData?.fullName)}
    </Text>
  </View>
  <TextInput
    placeholder="Write a comment..."
    placeholderTextColor={colors.textMuted}
    style={[styles.commentInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
    value={newComment}
    onChangeText={handleCommentChange}
    onSubmitEditing={handleAddComment}
  />
  <TouchableOpacity
    style={[styles.sendBtn, { backgroundColor: colors.primary }]}
    onPress={handleAddComment}
    disabled={submittingComment}
  >
    {submittingComment ? (
      <ActivityIndicator size="small" color={colors.white} />
    ) : (
      <Text style={[styles.sendBtnText, { color: colors.white }]}>➤</Text>
    )}
  </TouchableOpacity>
</View>

        {/* Archive Confirmation Modal */}
        <ConfirmationModal
          visible={isArchiveModalVisible}
          title="Archive Task"
          message="Are you sure you want to archive this task? You can access it later in archived tasks."
          confirmText="Archive"
          cancelText="Cancel"
          loading={archivingTask}
          onConfirm={handleArchiveTask}
          onCancel={() => setIsArchiveModalVisible(false)}
        />

        {/* Edit Task Modal */}
        <Modal visible={isEditModalVisible} animationType="slide" transparent>
          <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Task</Text>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Title</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Task Title"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Task Description"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.toggleBg, borderColor: colors.border }]}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveTaskEdits}
                  disabled={updatingTask}
                >
                  {updatingTask ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={[styles.saveBtnText, { color: colors.white }]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  backBtnInline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingBottom: 90 },
  sectionPadding: { paddingHorizontal: 20, marginBottom: 16 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 10, fontWeight: "bold" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1.5,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { fontSize: 14, fontWeight: "bold" },
  mentionsDropdown: {
    position: "absolute",
    bottom: 65,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    maxHeight: 150,
    padding: 4,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
    borderRadius: 8,
  },
  mentionItemText: { fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "600" },
});