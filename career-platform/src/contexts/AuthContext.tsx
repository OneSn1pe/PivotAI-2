'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getAuth,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, UserRole } from '@/types/user';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  register: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      try {
        setCurrentUser(user);
        
        if (user) {
          // Get the ID token
          const token = await user.getIdToken();
          
          // Set the token in a cookie
          document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
          
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUserProfile(userData);
            
            // Update last login time
            await setDoc(doc(db, 'users', user.uid), 
              { lastLogin: new Date() }, 
              { merge: true }
            );
          }
        } else {
          setUserProfile(null);
          // Clear the session cookie
          document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string, role: UserRole, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      setUserProfile(userData);
      
      // Get and set the token
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
      
      router.push('/protected/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Get and set the token
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
      
      // Update last login time
      await setDoc(doc(db, 'users', user.uid), 
        { lastLogin: new Date() }, 
        { merge: true }
      );
      
      router.push('/protected/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear the session cookie
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};