import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'comment' 
  | 'task' 
  | 'mention' 
  | 'deadline' 
  | 'invite' 
  | 'project' 
  | 'system';

export interface AppNotification {
  id: string;
  recipientId: string; // Target User ID
  senderId?: string;   // Triggering User ID (Optional for system alerts)
  type: NotificationType;
  text: string;
  projectId?: string;  // Associated Project ID
  taskId?: string;     // Associated Task ID
  read: boolean;
  createdAt: Timestamp | Date;
}