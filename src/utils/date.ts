import { Timestamp } from 'firebase/firestore';

/**
 * Safely converts a Firestore Timestamp, JS Date, string, or number to milliseconds.
 */
export const getMillis = (
  dateVal: Timestamp | Date | string | number | null | undefined
): number => {
  if (!dateVal) return 0;

  // 1. Check if it's an object containing toMillis (Firestore Timestamp)
  if (typeof dateVal === 'object' && 'toMillis' in dateVal && typeof dateVal.toMillis === 'function') {
    return dateVal.toMillis();
  }

  // 2. Check if it's a standard JS Date object
  if (dateVal instanceof Date) {
    return dateVal.getTime();
  }

  // 3. Handle numbers (e.g., Date.now() / timestamp numbers)
  if (typeof dateVal === 'number') {
    return dateVal;
  }

  // 4. Handle ISO strings / date strings
  if (typeof dateVal === 'string') {
    const parsed = new Date(dateVal).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

export const formatTimeAgo = (dateInput: any): string => {
  const millis = getMillis(dateInput);
  if (!millis) return '';

  const diffInSeconds = Math.floor((Date.now() - millis) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return new Date(millis).toLocaleDateString();
};