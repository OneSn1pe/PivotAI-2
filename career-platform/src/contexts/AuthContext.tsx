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

// Debug logger for easier tracking
const debug = {
  log: (...args: any[]) => console.log('[AuthContext]', ...args),
  error: (...args: any[]) => console.error('[AuthContext]', ...args),
  warn: (...args: any[]) => console.warn('[AuthContext]', ...args),
  info: (...args: any[]) => console.info('[AuthContext]', ...args),
};

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  register: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  debug.log('AuthProvider initializing');
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Create a debugging function to dump auth state
  const logAuthState = (prefix: string) => {
    debug.info(`${prefix} - Auth State`, {
      hasCurrentUser: !!currentUser,
      hasUserProfile: !!userProfile,
      loading,
      userRole: userProfile?.role
    });
    
    // Check session cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    debug.info(`${prefix} - Cookies`, {
      cookies: Object.keys(cookies),
      hasSessionCookie: 'session' in cookies
    });
  }

  useEffect(() => {
    debug.log('Setting up auth state listener');
    
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence)
      .then(() => debug.log('Set persistence to LOCAL'))
      .catch(error => debug.error('Error setting persistence:', error));

    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) {
        debug.log('Ignoring auth state change because component unmounted');
        return;
      }

      try {
        debug.log('Auth state changed', { hasUser: !!user, userId: user?.uid });
        setCurrentUser(user);
        
        if (user) {
          debug.log('User authenticated, getting token');
          // Get the ID token
          const token = await user.getIdToken();
          
          // Set the token in a cookie with extended expiry (3 hours)
          document.cookie = `session=${token}; path=/; max-age=10800; secure; samesite=strict`;
          debug.log('Session cookie set with token');
          
          debug.log('Fetching user profile from Firestore');
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            debug.info('User profile fetched', { 
              userId: userData.uid, 
              role: userData.role, 
              displayName: userData.displayName
            });
            setUserProfile(userData);
            
            // Update last login time
            debug.log('Updating last login time');
            await setDoc(doc(db, 'users', user.uid), 
              { lastLogin: new Date() }, 
              { merge: true }
            );
          } else {
            debug.warn('User authenticated but no Firestore profile found');
          }
        } else {
          debug.log('No user authenticated, clearing profile');
          setUserProfile(null);
          // Clear the session cookie
          document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          debug.log('Session cookie cleared');
        }
      } catch (error) {
        debug.error('Error in auth state change:', error);
        console.error('Error in auth state change:', error);
      } finally {
        if (mounted) {
          debug.log('Setting loading state to false');
          setLoading(false);
        }
      }
    });

    // Log the initial auth state after a small delay to ensure cookies are read
    setTimeout(() => {
      logAuthState('Initial Auth State');
    }, 500);

    return () => {
      debug.log('Cleaning up auth state listener');
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Log auth state changes
  useEffect(() => {
    logAuthState('Auth State Changed');
  }, [currentUser, userProfile, loading]);

  const register = async (email: string, password: string, role: UserRole, displayName: string) => {
    debug.log('Registration attempt', { email, role, displayName });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      debug.log('User registered successfully', { userId: user.uid });
      
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
      debug.log('User profile created in Firestore');
      setUserProfile(userData);
      
      // Get and set the token
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=10800; secure; samesite=strict`;
      debug.log('Session cookie set after registration');
      
      debug.log('Navigating to dashboard after registration');
      router.push('/protected/dashboard');
    } catch (error) {
      debug.error('Registration error:', error);
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    debug.log('Login attempt', { email });
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      debug.log('User logged in successfully', { userId: user.uid });
      
      // Get and set the token with extended expiry (3 hours)
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=10800; secure; samesite=strict`;
      debug.log('Session cookie set after login');
      
      // Update last login time
      await setDoc(doc(db, 'users', user.uid), 
        { lastLogin: new Date() }, 
        { merge: true }
      );
      debug.log('Last login time updated');
      
      debug.log('Navigating to dashboard after login');
      router.push('/protected/dashboard');
    } catch (error) {
      debug.error('Login error:', error);
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