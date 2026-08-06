import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  createdAt: Timestamp | Date;
}