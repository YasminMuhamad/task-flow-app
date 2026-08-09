import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  company?: string;
  createdAt: Timestamp | Date;
}