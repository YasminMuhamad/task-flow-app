import { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'High' | 'Med' | 'Low';
export type TaskStatus = 'todo' | 'inprogress' | 'done';

// Subcollection: tasks/{taskId}/checklist
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}
// Subcollection: tasks/{taskId}/comments
export interface TaskAttachment {
  id: string;
  name: string;
  type: string; // e.g. 'PDF' | 'JPG' | 'PNG'
  size: string;
  url: string;
  uploadedBy: string;
  createdAt: Timestamp | Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: Timestamp | Date;
  readBy?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  dueDate: Timestamp | Date;
  priority: TaskPriority;
  status: TaskStatus;
  checklist?: ChecklistItem[];
  attachments?: TaskAttachment[];
  overdue?: boolean;
  createdBy?: string;
  createdAt?: Timestamp | Date;
}