import { useState, useEffect } from "react";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
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
import { sendNotification } from "../services/notificationService";
import { getMillis } from "../utils/date";

export function useTaskDetails(taskId: string, onBack?: () => void) {
  const { user: currentUser, profileData, userProjects, usersMap, allProjectTasks } = useAppContext();

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

  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [updatingTask, setUpdatingTask] = useState<boolean>(false);

  const [isArchiveModalVisible, setIsArchiveModalVisible] = useState<boolean>(false);
  const [archivingTask, setArchivingTask] = useState<boolean>(false);

  const [mentionQuery, setMentionQuery] = useState<string>("");
  const [showMentionsList, setShowMentionsList] = useState<boolean>(false);

  const currentProjectObj = userProjects?.find((p) => p.id === task?.projectId);
  const projectMemberIds = currentProjectObj?.memberIds || [];
  const assignee = task?.assigneeId ? usersMap[task.assigneeId] : null;

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
      }
    );
    return () => unsubscribeTask();
  }, [taskId]);

  // 2. Fetch Checklist
  useEffect(() => {
    if (!taskId) return;
    const checkRef = collection(db, "tasks", taskId, "checklist");
    return onSnapshot(checkRef, (snapshot) => {
      const items: ChecklistItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ChecklistItem);
      });

      items.sort((a, b) => {
        if (a.done === b.done) return 0;
        return a.done ? 1 : -1; 
      });

      setChecklist(items);
    });
  }, [taskId]);

  // 3. Fetch Comments
  useEffect(() => {
    if (!taskId) return;
    const commentsRef = collection(db, "tasks", taskId, "comments");
    return onSnapshot(commentsRef, (snapshot) => {
      const items: TaskComment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TaskComment);
      });
      items.sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt));
      setComments(items);
    });
  }, [taskId]);

  // 4. Fetch Attachments
  useEffect(() => {
    if (!taskId) return;
    const attachRef = collection(db, "tasks", taskId, "attachments");
    return onSnapshot(attachRef, (snapshot) => {
      const items: TaskAttachment[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TaskAttachment);
      });
      setAttachments(items);
    });
  }, [taskId]);

  // Handlers
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
      await addDoc(checkRef, { label: newChecklistItem.trim(), done: false, createdAt: serverTimestamp() });
      setNewChecklistItem("");
    } catch (error) {
      console.error("Error adding checklist item:", error);
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
    setNewComment(`${baseText}@${userName} `);
    setShowMentionsList(false);
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
      const allInterestedUsers = Array.from(new Set([...assignees, ...previousCommenters]));
      const generalRecipients = allInterestedUsers.filter((id) => id !== currentUser.uid);

      const membersToMentionInComment = projectMemberIds
        .map((id) => usersMap[id])
        .filter((u: any) => u && u.uid !== currentUser?.uid && commentText.includes(`@${u.fullName}`));

      await Promise.all([
        ...generalRecipients.map((recipientId) =>
          sendNotification({
            recipientId,
            senderId: currentUser.uid,
            type: "comment",
            text: `${profileData?.fullName || "Someone"} commented on "${task.title}"`,
            projectId: task.projectId,
            taskId: task.id,
          })
        ),
        ...membersToMentionInComment.map((targetUser: any) =>
          sendNotification({
            recipientId: targetUser.uid,
            senderId: currentUser.uid,
            type: "mention",
            text: `${profileData?.fullName || "Someone"} mentioned you in a comment on "${task.title}"`,
            projectId: task.projectId,
            taskId: task.id,
          })
        ),
      ]);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUploadAttachment = async () => {
    if (!currentUser) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

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
        const cleanUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        formData.append("file", {
          uri: cleanUri,
          type: file.mimeType || "application/octet-stream",
          name: file.name || `upload_${Date.now()}`,
        } as any);
      }

      formData.append("upload_preset", "yrwcqwqv");
      const response = await fetch("https://api.cloudinary.com/v1_1/dskzuvxjp/auto/upload", {
        method: "POST",
        body: formData,
      });
      const cloudinaryData = await response.json();
      if (!response.ok) throw new Error(cloudinaryData.error?.message || "Upload failed");

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
      console.error("Error uploading file:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCycleStatus = async () => {
    if (!task) return;
    const statusMap: Record<TaskStatus, TaskStatus> = { todo: "inprogress", inprogress: "done", done: "todo" };
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: statusMap[task.status] || "todo" });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleCyclePriority = async () => {
    if (!task) return;
    const priorityMap: Record<TaskPriority, TaskPriority> = { Low: "Med", Med: "High", High: "Low" };
    try {
      await updateDoc(doc(db, "tasks", taskId), { priority: priorityMap[task.priority] || "Med" });
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleSaveTaskEdits = async () => {
    if (!editTitle.trim()) return;
    setUpdatingTask(true);
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Error saving edits:", error);
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleArchiveTask = async () => {
    if (!taskId) return;
    setArchivingTask(true);
    try {
      await updateDoc(doc(db, "tasks", taskId), { archived: true, updatedAt: serverTimestamp() });
      setIsArchiveModalVisible(false);
      if (onBack) onBack();
    } catch (error) {
      console.error("Error archiving task:", error);
    } finally {
      setArchivingTask(false);
    }
  };
 const filteredMembersToMention = projectMemberIds
    .map((id) => usersMap[id])
    .filter((u: any) => u && u.uid !== currentUser?.uid && u.fullName && u.fullName.toLowerCase().includes(mentionQuery.toLowerCase()));

  return {
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
  };
}