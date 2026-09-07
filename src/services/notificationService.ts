import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase';
import { NotificationType } from '../types/notification';

interface SendNotifParams {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  text: string;
  projectId?: string;
  taskId?: string;
}

export const sendNotification = async ({
  recipientId,
  senderId,
  type,
  text,
  projectId,
  taskId,
}: SendNotifParams) => {
  // Prevent sending notifications to oneself
  if (recipientId === senderId) return;

  try {
    await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId,
      type,
      text,
      projectId: projectId || null,
      taskId: taskId || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};