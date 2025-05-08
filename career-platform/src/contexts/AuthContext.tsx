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
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
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
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
  refreshToken: (force?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper function to set session cookie with consistent settings
  const setSessionCookie = (token: string, maxAge: number = 28800) => { // 8 hours by default
    const secure = window.location.protocol === 'https:';
    const domain = window.location.hostname;
    document.cookie = `session=${token}; path=/; max-age=${maxAge}; ${secure ? 'secure; ' : ''}samesite=strict; domain=${domain}`;
  };

  // Token refresh function that can be called when needed
  const refreshToken = async (force: boolean = false) => {
    if (!currentUser) return null;
    
    try {
      const token = await currentUser.getIdToken(force);
      setSessionCookie(token);
      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('Auth persistence set to LOCAL'))
      .catch(error => console.error('Error setting persistence:', error));

    let mounted = true;
    
    // Set up token refresh interval (every hour)
    const tokenRefreshInterval = setInterval(() => {
      if (currentUser) {
        console.log('Refreshing token...');
        refreshToken(true)
          .then(token => {
            if (token) console.log('Token refreshed successfully');
          })
          .catch(error => console.error('Error refreshing token:', error));
      }
    }, 60 * 60 * 1000); // 1 hour

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      try {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        setCurrentUser(user);
        
        if (user) {
          // Get the ID token with force refresh to ensure it's new
          const token = await user.getIdToken(true);
          
          // Set the token in a cookie with extended expiration (8 hours)
          setSessionCookie(token, 28800);
          
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
          } else {
            console.warn(`User document not found for uid: ${user.uid}`);
          }
        } else {
          setUserProfile(null);
          // Clear the session cookie
          document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'session=; path=/; max-age=0; domain=' + window.location.hostname;
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
      clearInterval(tokenRefreshInterval);
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

  const loginWithGoogle = async (role?: UserRole) => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // If role is not provided, default to candidate
        const actualRole = role || UserRole.CANDIDATE;
        
        // New user, create profile
        const userData: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          role: actualRole,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        setUserProfile(userData);
      } else {
        // Existing user, update last login
        await setDoc(doc(db, 'users', user.uid), 
          { lastLogin: new Date() }, 
          { merge: true }
        );
        setUserProfile(userDoc.data() as User);
      }
      
      // Get and set the token
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
      
      // Redirect based on user role
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        if (userData.role === UserRole.CANDIDATE) {
          router.push('/protected/candidate/dashboard');
        } else {
          router.push('/protected/recruiter/dashboard');
        }
      } else {
        // For new users
        if (role === UserRole.RECRUITER) {
          router.push('/protected/recruiter/dashboard');
        } else {
          router.push('/protected/candidate/dashboard');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Set loading state to avoid race conditions
      setLoading(true);
      
      // Clear user data first
      setUserProfile(null);
      setCurrentUser(null);
      
      // Clear session cookies
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'session=; path=/; max-age=0; domain=' + window.location.hostname;
      
      // Perform Firebase signout
      await signOut(auth);
      
      // Add a fallback for navigation
      try {
        router.push('/auth/login');
      } catch (error) {
        console.error('Navigation error during logout:', error);
        // Use direct location redirect as fallback
        window.location.href = '/auth/login';
      }
      
      // Add a safety timeout in case we get stuck
      setTimeout(() => {
        if (window.location.pathname.includes('/protected')) {
          console.warn('Logout redirect failed, forcing redirect');
          window.location.href = '/auth/login';
        }
      }, 2000);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to navigate away
      window.location.href = '/auth/login';
    } finally {
      // Always make sure loading state is reset
      setLoading(false);
    }
  };

  const updateUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};