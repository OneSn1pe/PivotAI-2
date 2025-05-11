/**
 * Firebase utility functions
 */

/**
 * Safely converts a Firestore timestamp to a JavaScript Date
 * Works with various timestamp formats across environments
 * 
 * @param timestamp - Firestore timestamp or any other value
 * @returns JavaScript Date object or null if conversion fails
 */
export function safeTimestampToDate(timestamp: any): Date | null {
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Firestore Timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (err) {
      console.error('Failed to convert Firestore timestamp using toDate()', err);
    }
  }
  
  // Timestamp as object with seconds and nanoseconds (serialized Firestore timestamp)
  if (timestamp && 
      typeof timestamp === 'object' && 
      'seconds' in timestamp && 
      'nanoseconds' in timestamp) {
    try {
      // Convert seconds and nanoseconds to milliseconds
      const milliseconds = (timestamp.seconds * 1000) + (timestamp.nanoseconds / 1000000);
      return new Date(milliseconds);
    } catch (err) {
      console.error('Failed to convert timestamp from seconds/nanoseconds', err);
    }
  }
  
  // ISO string format
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (err) {
      console.error('Failed to parse timestamp string', err);
    }
  }
  
  // Number (milliseconds since epoch)
  if (typeof timestamp === 'number') {
    try {
      return new Date(timestamp);
    } catch (err) {
      console.error('Failed to convert numeric timestamp', err);
    }
  }
  
  // Conversion failed
  return null;
} 