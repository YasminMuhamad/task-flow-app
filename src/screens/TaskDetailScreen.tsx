import React, { useState, useEffect } from "react";
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
import { getMillis } from "../utils/date";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";
import Svg, { Path } from "react-native-svg";
import { db } from "../api/firebase";
import {
  Task,
  ChecklistItem,
  TaskComment,
  TaskAttachment,
  TaskStatus,
  TaskPriority,
} from "../types/task";
import { useAppContext } from "../context/AppContext";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { sendNotification } from "../services/notificationService";

interface Props {
  onBack?: () => void;
  taskId: string;
}

export default function TaskDetailScreen({ onBack, taskId }: Props) {
  const insets = useSafeAreaInsets();

  const {
    user: currentUser,
    profileData,
    userProjects,
    usersMap,
    allProjectTasks,
    getInitials,
  } = useAppContext();

  // States
  const [task, setTask] = useState<Task | null>(() => {
    return allProjectTasks.find((t) => t.id === taskId) || null;
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(!task);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form & Modals States
  const [newChecklistItem, setNewChecklistItem] = useState<string>("");
  const [newComment, setNewComment] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // Edit Task States
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [updatingTask, setUpdatingTask] = useState<boolean>(false);

  const assignee = task?.assigneeId ? usersMap[task.assigneeId] : null;
  const currentProject = userProjects?.find((p) => p.id === task?.projectId);
  const projectName = currentProject?.title || `Project #${task?.projectId}`;

  const [isArchiveModalVisible, setIsArchiveModalVisible] =
    useState<boolean>(false);
  const [archivingTask, setArchivingTask] = useState<boolean>(false);

  const [mentionQuery, setMentionQuery] = useState<string>("");
  const [showMentionsList, setShowMentionsList] = useState<boolean>(false);

  // 1. Fetch Task Main Info
  useEffect(() => {
    if (!taskId) return;

    const taskRef = doc(db, "tasks", taskId);
    const unsubscribeTask = onSnapshot(
      taskRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Task;
          setTask({ ...data, id: docSnap.id });
          setEditTitle(data.title || "");
          setEditDesc(data.description || "");
          setErrorMsg(null);
        } else {
          setErrorMsg("Task not found or has been deleted.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Task fetch error:", err);
        setErrorMsg("Failed to load task details.");
        setLoading(false);
      },
    );

    return () => unsubscribeTask();
  }, [taskId]);

  // 2. Fetch Checklist Subcollection
  useEffect(() => {
    if (!taskId) return;

    const checkRef = collection(db, "tasks", taskId, "checklist");
    const unsubscribeCheck = onSnapshot(checkRef, (snapshot) => {
      const items: ChecklistItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ChecklistItem);
      });
      setChecklist(items);
    });

    return () => unsubscribeCheck();
  }, [taskId]);

  // 3. Fetch Comments Subcollection (Sorted Oldest -> Newest)
  useEffect(() => {
    if (!taskId) return;

    const commentsRef = collection(db, "tasks", taskId, "comments");
    const unsubscribeComments = onSnapshot(commentsRef, (snapshot) => {
      const items: TaskComment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TaskComment);
      });

      // Sort chronological (Oldest first, Newest at bottom)
      items.sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt));

      setComments(items);
    });

    return () => unsubscribeComments();
  }, [taskId]);

  // 4. Fetch Attachments Subcollection
  useEffect(() => {
    if (!taskId) return;

    const attachRef = collection(db, "tasks", taskId, "attachments");
    const unsubscribeAttach = onSnapshot(attachRef, (snapshot) => {
      const items: TaskAttachment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TaskAttachment);
      });
      setAttachments(items);
    });

    return () => unsubscribeAttach();
  }, [taskId]);

  // --- Handlers ---
  const toggleChecklistItem = async (item: ChecklistItem) => {
    try {
      const itemRef = doc(db, "tasks", taskId, "checklist", item.id);
      await updateDoc(itemRef, { done: !item.done });
    } catch (error) {
      console.error("Error updating checklist:", error);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    try {
      const checkRef = collection(db, "tasks", taskId, "checklist");
      await addDoc(checkRef, {
        label: newChecklistItem.trim(),
        done: false,
      });
      setNewChecklistItem("");
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };

  const getAttachmentConfig = (typeStr?: string, fileName?: string) => {
    const ext = (typeStr || fileName?.split(".").pop() || "").toLowerCase();
    if (["pdf", "txt", "doc", "docx", "file"].includes(ext)) {
      return { icon: "📄", color: "#FEE2E2" };
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "image"].includes(ext)) {
      return { icon: "🖼️", color: "#C5D5E4" };
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      return { icon: "📦", color: "#FEF08A" };
    }
    return { icon: "📎", color: "#E2E8F0" };
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser || !task) return;
    setSubmittingComment(true);

    try {
      const commentsRef = collection(db, "tasks", taskId, "comments");

      await addDoc(commentsRef, {
        taskId,
        authorId: currentUser.uid,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      const commentText = newComment.trim();
      setNewComment("");
      setShowMentionsList(false);

      const assignees = task.assigneeId ? [task.assigneeId] : [];
      const previousCommenters = comments.map((c) => c.authorId);
      const allInterestedUsers = Array.from(
        new Set([...assignees, ...previousCommenters]),
      );
      const generalRecipients = allInterestedUsers.filter(
        (userId) => userId !== currentUser.uid,
      );

      const membersToMentionInComment = projectMemberIds
        .map((id) => usersMap[id])
        .filter(
          (u: any) =>
            u &&
            u.uid !== currentUser?.uid &&
            commentText.includes(`@${u.fullName}`),
        );

      await Promise.all(
        generalRecipients.map((recipientId) =>
          sendNotification({
            recipientId,
            senderId: currentUser.uid,
            type: "comment",
            text: `${profileData?.fullName || "Someone"} commented on "${task.title}"`,
            projectId: task.projectId,
            taskId: task.id,
          }),
        ),
      );

      await Promise.all(
        membersToMentionInComment.map((targetUser: any) =>
          sendNotification({
            recipientId: targetUser.uid,
            senderId: currentUser.uid,
            type: "mention",
            text: `${profileData?.fullName || "Someone"} mentioned you in a comment on "${task.title}"`,
            projectId: task.projectId,
            taskId: task.id,
          }),
        ),
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentChange = (text: string) => {
    setNewComment(text);

    const lastAtIndex = text.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const query = text.slice(lastAtIndex + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentionsList(true);
        return;
      }
    }
    setShowMentionsList(false);
  };

  const handleSelectUserToMention = (userName: string) => {
    const lastAtIndex = newComment.lastIndexOf("@");
    const baseText = newComment.slice(0, lastAtIndex);
    const updatedText = `${baseText}@${userName} `;

    setNewComment(updatedText);
    setShowMentionsList(false);
  };

  const handleUploadAttachment = async () => {
    if (!currentUser) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0)
        return;

      const file = result.assets[0];
      setUploadingFile(true);

      const formData = new FormData();

      if (Platform.OS === "web") {
        if (file.file) {
          formData.append("file", file.file);
        } else {
          const fileResponse = await fetch(file.uri);
          const blob = await fileResponse.blob();
          formData.append("file", blob, file.name || "upload");
        }
      } else {
        const cleanUri =
          Platform.OS === "android"
            ? file.uri
            : file.uri.replace("file://", "");
        formData.append("file", {
          uri: cleanUri,
          type: file.mimeType || "application/octet-stream",
          name: file.name || `upload_${Date.now()}`,
        } as any);
      }

      const CLOUD_NAME = "dskzuvxjp";
      const UPLOAD_PRESET = "yrwcqwqv";

      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData },
      );

      const cloudinaryData = await response.json();

      if (!response.ok) {
        throw new Error(cloudinaryData.error?.message || "Upload failed");
      }

      const attachRef = collection(db, "tasks", taskId, "attachments");
      await addDoc(attachRef, {
        name: file.name,
        type: file.mimeType?.split("/")[1]?.toUpperCase() || "FILE",
        size: `${(file.size ? file.size / (1024 * 1024) : 0).toFixed(1)} MB`,
        url: cloudinaryData.secure_url,
        uploadedBy: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error uploading file to Cloudinary:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCycleStatus = async () => {
    if (!task) return;
    const statusMap: Record<TaskStatus, TaskStatus> = {
      todo: "inprogress",
      inprogress: "done",
      done: "todo",
    };
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { status: statusMap[task.status] || "todo" });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleCyclePriority = async () => {
    if (!task) return;
    const priorityMap: Record<TaskPriority, TaskPriority> = {
      Low: "Med",
      Med: "High",
      High: "Low",
    };
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        priority: priorityMap[task.priority] || "Med",
      });
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleSaveTaskEdits = async () => {
    if (!editTitle.trim()) return;
    setUpdatingTask(true);
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Error saving task edits:", error);
    } finally {
      setUpdatingTask(false);
    }
  };

  const formatDate = (dateInput: any) => {
    const millis = getMillis(dateInput);
    if (!millis) return "N/A";
    return new Date(millis).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateInput: any) => {
    const millis = getMillis(dateInput);
    if (!millis) return "";
    return new Date(millis).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const doneCount = checklist.filter((c) => c.done).length;
  const pct =
    checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const handleArchiveTask = async () => {
    if (!taskId) return;
    setArchivingTask(true);
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        archived: true,
        updatedAt: serverTimestamp(),
      });
      setIsArchiveModalVisible(false);
      if (onBack) onBack();
    } catch (error) {
      console.error("Error archiving task:", error);
    } finally {
      setArchivingTask(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#566551" />
      </SafeAreaView>
    );
  }

  if (errorMsg || !task) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{errorMsg || "Task unavailable"}</Text>
        {onBack && (
          <TouchableOpacity style={styles.backBtnInline} onPress={onBack}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const currentProjectObj = userProjects?.find((p) => p.id === task?.projectId);
  const projectMemberIds = currentProjectObj?.memberIds || [];

  const filteredMembersToMention = projectMemberIds
    .map((id) => usersMap[id])
    .filter(
      (u: any) =>
        u &&
        u.uid !== currentUser?.uid &&
        u.fullName?.toLowerCase().includes(mentionQuery.toLowerCase()),
    );

  const renderFormattedComment = (text: string) => {
    const memberNames = projectMemberIds
      .map((id) => usersMap[id]?.fullName)
      .filter((v): v is string => !!v);

    const words = text.split(" ");

    return words.map((word, index) => {
      const cleanName = word.startsWith("@") ? word.substring(1) : "";
      const isExactMention = memberNames.includes(cleanName);

      if (
        isExactMention ||
        (word.startsWith("@") &&
          memberNames.some((name) => word.substring(1).includes(name)))
      ) {
        return (
          <Text key={index} style={styles.mentionHighlight}>
            {word}{" "}
          </Text>
        );
      }
      return <Text key={index}>{word} </Text>;
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#566551" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M10 4L6 8l4 4"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {projectName}
          </Text>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <Path
                d="M10.5 2.5L12.5 4.5M2 13l2.5-.5L12.5 4.5 10.5 2.5 2.5 10.5 2 13z"
                stroke="#fff"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsArchiveModalVisible(true)}
          >
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M14 5v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5M1 2h14v3H1V2zM6 8h4"
                stroke="#fff"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title & Status */}
          <View style={styles.sectionPadding}>
            <View style={styles.titleRow}>
              <Text style={styles.taskTitle}>{task.title}</Text>

              <TouchableOpacity onPress={handleCycleStatus} activeOpacity={0.8}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        task.status === "done"
                          ? "#DCFCE7"
                          : task.status === "inprogress"
                            ? "#C5D5E4"
                            : "#FEF08A",
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: "#1E293B" }]}>
                    {task.status === "inprogress"
                      ? "In Progress"
                      : task.status === "done"
                        ? "Done"
                        : "To Do"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Meta Bar */}
            <View style={styles.metaBar}>
              <View style={styles.metaItem}>
                <View style={[styles.avatar, { backgroundColor: "#566551" }]}>
                  <Text style={styles.avatarText}>
                    {getInitials(assignee?.fullName)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.metaLabelBold}>
                    {assignee?.fullName || "Unassigned"}
                  </Text>
                  <Text style={styles.metaSub}>Assignee</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaItem}>
                <View>
                  <Text style={styles.metaLabelBold}>
                    {formatDate(task.dueDate)}
                  </Text>
                  <Text style={styles.metaSub}>Due date</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.metaItem}
                onPress={handleCyclePriority}
                activeOpacity={0.7}
              >
                <View>
                  <Text
                    style={[
                      styles.metaLabelBold,
                      {
                        color:
                          task.priority === "High"
                            ? "#DC2626"
                            : task.priority === "Med"
                              ? "#D97706"
                              : "#16A34A",
                      },
                    ]}
                  >
                    {task.priority}
                  </Text>
                  <Text style={styles.metaSub}>Priority ↻</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionPadding}>
            <Text style={styles.sectionHeader}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>
              {task.description || "No description provided."}
            </Text>
          </View>

          {/* Checklist */}
          <View style={styles.sectionPadding}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeader}>CHECKLIST</Text>
              <Text style={styles.progressText}>
                {doneCount}/{checklist.length} — {pct}%
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
            </View>

            {checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.checkCard, item.done && styles.checkCardDone]}
                onPress={() => toggleChecklistItem(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, item.done && styles.checkboxActive]}
                >
                  {item.done && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.checkLabel,
                    item.done && styles.checkLabelDone,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.addItemRow}>
              <TextInput
                placeholder="+ Add checklist item..."
                placeholderTextColor="#94A3B8"
                style={styles.addItemInput}
                value={newChecklistItem}
                onChangeText={setNewChecklistItem}
                onSubmitEditing={handleAddChecklistItem}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddChecklistItem}
              >
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Attachments */}
          <View style={styles.sectionPadding}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeader}>ATTACHMENTS</Text>
              <TouchableOpacity
                onPress={handleUploadAttachment}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <ActivityIndicator size="small" color="#566551" />
                ) : (
                  <Text style={styles.uploadBtnText}>+ Upload</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.attachmentsGrid}>
              {attachments.length === 0 ? (
                <Text style={styles.emptyText}>No attachments added yet</Text>
              ) : (
                attachments.map((f) => {
                  const { icon, color } = getAttachmentConfig(f.type, f.name);

                  return (
                    <View key={f.id} style={styles.attachmentCard}>
                      <View
                        style={[styles.fileIconBox, { backgroundColor: color }]}
                      >
                        <Text style={{ fontSize: 16 }}>{icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {f.name}
                        </Text>
                        <Text style={styles.fileMeta}>
                          {f.type} · {f.size}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* Activity / Comments */}
          <View style={styles.sectionPadding}>
            <Text style={styles.sectionHeader}>
              ACTIVITY ({comments.length})
            </Text>
            {comments.length === 0 ? (
              <Text style={styles.emptyText}>No comments yet</Text>
            ) : (
              <ScrollView
                style={styles.commentsScrollContainer}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {comments.map((c) => {
                  const author = usersMap[c.authorId];
                  return (
                    <View key={c.id} style={styles.commentRow}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: "#8DA68A", marginTop: 4 },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {getInitials(author?.fullName)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentName}>
                            {author?.fullName || "User"}
                          </Text>
                          <Text style={styles.commentTime}>
                            {formatTime(c.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.commentBubble}>
                          <Text style={styles.commentText}>
                            {renderFormattedComment(c.text)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {/* Dropdown القائمة المنسدلة للمنشن */}
        {showMentionsList && filteredMembersToMention.length > 0 && (
          <View style={styles.mentionsDropdown}>
            {filteredMembersToMention.map((member: any) => (
              <TouchableOpacity
                key={member.uid}
                style={styles.mentionItem}
                onPress={() => handleSelectUserToMention(member.fullName)}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: "#566551", width: 24, height: 24 },
                  ]}
                >
                  <Text style={[styles.avatarText, { fontSize: 8 }]}>
                    {getInitials(member.fullName)}
                  </Text>
                </View>
                <Text style={styles.mentionItemText}>{member.fullName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Bottom Comment Input */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
          <View style={[styles.avatar, { backgroundColor: "#566551" }]}>
            <Text style={styles.avatarText}>
              {getInitials(profileData?.fullName)}
            </Text>
          </View>
          <TextInput
            placeholder="Write a comment..."
            placeholderTextColor="#94A3B8"
            style={styles.commentInput}
            value={newComment}
            onChangeText={handleCommentChange}
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleAddComment}
            disabled={submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>

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

        {/* Edit Modal */}
        <Modal visible={isEditModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Task</Text>

              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Task Title"
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Task Description"
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveTaskEdits}
                  disabled={updatingTask}
                >
                  {updatingTask ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyText: { color: "#94A3B8", fontSize: 12, fontStyle: "italic" },
  backBtnInline: {
    backgroundColor: "#566551",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  header: {
    backgroundColor: "#566551",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingBottom: 90 },
  sectionPadding: { paddingHorizontal: 20, marginBottom: 16 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    lineHeight: 26,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: "600" },
  metaBar: {
    flexDirection: "row",
    backgroundColor: "#C5D5E4",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
  },
  metaItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabelBold: { fontSize: 12, fontWeight: "600", color: "#1E293B" },
  metaSub: { fontSize: 11, color: "#566551" },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(86,101,81,0.2)",
    marginHorizontal: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  descriptionText: { fontSize: 14, color: "#1E293B", lineHeight: 22 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: { fontSize: 12, fontWeight: "600", color: "#566551" },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#566551",
    borderRadius: 2,
  },
  checkCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    gap: 12,
  },
  checkCardDone: { backgroundColor: "#F8F9FA" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#566551", borderColor: "#566551" },
  checkIcon: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  checkLabel: { fontSize: 14, color: "#1E293B", flex: 1 },
  checkLabelDone: { textDecorationLine: "line-through", opacity: 0.5 },
  addItemRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  addItemInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#C5D5E4",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1E293B",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#566551",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  uploadBtnText: { fontSize: 12, fontWeight: "600", color: "#566551" },
  attachmentsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attachmentCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 12, fontWeight: "600", color: "#1E293B" },
  fileMeta: { fontSize: 10, color: "#94A3B8" },
  commentsScrollContainer: {
    maxHeight: 280,
    paddingRight: 4,
  },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  commentName: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  commentTime: { fontSize: 10, color: "#94A3B8" },
  commentBubble: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentText: { fontSize: 13, color: "#1E293B", lineHeight: 18 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1.5,
    borderTopColor: "#E2E8F0",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1E293B",
    maxHeight: 80,
  },
  mentionsDropdown: {
    position: "absolute",
    bottom: 65,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
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
  mentionItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  mentionHighlight: {
    color: "#3370f5",
    fontWeight: "700",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#566551",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#566551",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
