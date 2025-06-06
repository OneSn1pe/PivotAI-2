// Centralized Firebase Service
// This reduces duplicate imports and improves tree-shaking

import { 
  ref, 
  getDownloadURL, 
  listAll, 
  uploadBytes, 
  uploadBytesResumable,
  getBlob,
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, storage } from '@/config/firebase';

// Storage service
export const storageService = {
  // File upload
  async uploadFile(path: string, file: File | Blob) {
    const storageRef = ref(storage, path);
    return uploadBytes(storageRef, file);
  },

  // File upload with progress
  uploadFileWithProgress(path: string, file: File | Blob) {
    const storageRef = ref(storage, path);
    return uploadBytesResumable(storageRef, file);
  },

  // Get download URL
  async getDownloadURL(path: string) {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },

  // Get file blob
  async getFileBlob(path: string) {
    const storageRef = ref(storage, path);
    return getBlob(storageRef);
  },

  // List files
  async listFiles(path: string) {
    const storageRef = ref(storage, path);
    return listAll(storageRef);
  },

  // Delete file
  async deleteFile(path: string) {
    const storageRef = ref(storage, path);
    return deleteObject(storageRef);
  }
};

// Firestore service
export const firestoreService = {
  // Get document
  async getDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    return getDoc(docRef);
  },

  // Get collection
  async getCollection(collectionName: string, constraints?: any[]) {
    const collectionRef = collection(db, collectionName);
    const q = constraints ? query(collectionRef, ...constraints) : collectionRef;
    return getDocs(q);
  },

  // Add document
  async addDocument(collectionName: string, data: any) {
    const collectionRef = collection(db, collectionName);
    return addDoc(collectionRef, data);
  },

  // Update document
  async updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = doc(db, collectionName, docId);
    return updateDoc(docRef, data);
  },

  // Delete document
  async deleteDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    return deleteDoc(docRef);
  },

  // Query helpers
  where,
  orderBy
};

// Combined service for common operations
export const firebaseService = {
  storage: storageService,
  firestore: firestoreService
}; 