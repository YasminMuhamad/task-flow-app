import { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'High' | 'Med' | 'Low';
export type TaskStatus = 'todo' | 'inprogress' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  dueDate: Timestamp | Date;
  priority: TaskPriority;
  status: TaskStatus;
  overdue?: boolean;
  createdBy?: string;
  createdAt?: Timestamp | Date;
}