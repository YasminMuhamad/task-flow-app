import { Timestamp } from 'firebase/firestore';

export interface Project {
  id: string;
  title: string;
  desc?: string;
  progress: number;
  memberIds: string[];
  tag: string;
  createdAt?: Timestamp | Date;
  createdBy?: string;
}