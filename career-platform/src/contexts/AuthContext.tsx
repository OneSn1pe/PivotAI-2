'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
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
import { isDevelopmentMode, setCookie, deleteCookie, logEnvironmentInfo } from '@/utils/environment';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Use our environment utility instead of inline checks
  const isDevMode = isDevelopmentMode();
  
  // Only set custom claims if needed - track if we've already done it
  const [claimsSet, setClaimsSet] = useState(false);

  console.log(`[AuthContext] Provider initialized, isDevMode: ${isDevMode}`);
  
  // Log environment info on initialization
  useEffect(() => {
    logEnvironmentInfo('AuthContext');
  }, []);

  // Function to set custom claims - optimized to only run when necessary
  const setCustomClaims = async (uid: string) => {
    // Skip if we've already set claims in this session
    if (claimsSet) return true;
    
    // Skip in development mode to avoid errors
    if (isDevMode) {
      console.log('[AuthContext] Skipping custom claims in development mode');
      setClaimsSet(true);
      return true;
    }
    
    try {
      console.log(`[AuthContext] Setting custom claims for user: ${uid}`);
      
      // Try multiple endpoints in sequence until one succeeds
      const endpoints = [
        {
          url: '/api/auth/set-role-claim',
          payload: { uid }
        },
        {
          url: '/api/set-custom-claims',
          payload: { 
            uid, 
            customClaims: { role: userProfile?.role }
          }
        },
        {
          url: '/api/auth/edge-set-role',
          payload: { 
            uid, 
            role: userProfile?.role
          }
        }
      ];
      
      let success = false;
      let finalError = null;
      
      // Try each endpoint
      for (const endpoint of endpoints) {
        if (success) break;
        
        try {
          console.log(`[AuthContext] Trying endpoint: ${endpoint.url}`);
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(endpoint.payload),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            console.log(`[AuthContext] Successfully set claims using ${endpoint.url}:`, data);
            success = true;
            setClaimsSet(true);
          } else {
            console.warn(`[AuthContext] Endpoint ${endpoint.url} failed:`, data.error);
            finalError = data.error;
          }
        } catch (err) {
          console.warn(`[AuthContext] Error with endpoint ${endpoint.url}:`, err);
          finalError = err;
        }
      }
      
      if (!success) {
        console.error('[AuthContext] All claim setting endpoints failed:', finalError);
        return false;
      }
      
      // Force token refresh to include the new claims - always force refresh after setting claims
      if (currentUser) {
        try {
          // Wait for a short delay to ensure claims have propagated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Force refresh the token to get the new claims
          const token = await currentUser.getIdToken(true);
          console.log('[AuthContext] Token refreshed with new claims');
          
          // Update the session cookie with the new token using our utility
          if (typeof document !== 'undefined') {
            setCookie('session', token, 3600);
            console.log('[AuthContext] Updated session cookie with fresh token');
          }
        } catch (refreshError) {
          console.error('[AuthContext] Error refreshing token after setting claims:', refreshError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('[AuthContext] Error setting custom claims:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      try {
        console.log(`[AuthContext] Auth state changed: User ${user ? 'present' : 'absent'}`);
        setCurrentUser(user);
        
        if (user) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log(`[AuthContext] User role: ${userData.role}`);
            setUserProfile(userData);
            
            // Set custom claims if needed - but don't do it repeatedly
            if (!claimsSet) {
              await setCustomClaims(user.uid);
              // Claims and token refresh are now handled inside setCustomClaims
            } else {
              // If claims are already set, just check if we need to set the session cookie
              const hasSessionCookie = document.cookie.includes('session=');
              if (!hasSessionCookie) {
                try {
                  // Get the token without forcing refresh
                  const token = await user.getIdToken(false);
                  
                  // Set the cookie using our utility function
                  setCookie('session', token, 3600);
                  console.log('[AuthContext] Set session cookie');
                } catch (tokenErr) {
                  console.error('[AuthContext] Error getting token:', tokenErr);
                }
              }
            }
            
            // Update last login time - but only once per session
            if (!claimsSet) {
              await setDoc(doc(db, 'users', user.uid), 
                { lastLogin: new Date() }, 
                { merge: true }
              );
            }
          } else {
            console.error(`[AuthContext] No user document found for uid: ${user.uid}`);
          }
        } else {
          setUserProfile(null);
          // Clear the session cookie using our utility
          deleteCookie('session');
          console.log('[AuthContext] Cleared session cookie');
        }
      } catch (error) {
        console.error('[AuthContext] Error in auth state change:', error);
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

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore, always as candidate
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role: UserRole.CANDIDATE,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      setUserProfile(userData);
      
      // Set custom claims
      await setCustomClaims(user.uid);
      
      // Get and set the token
      const token = await user.getIdToken(true); // Force refresh to get updated claims
      document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
      
      router.push('/protected/candidate/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Set custom claims
      await setCustomClaims(user.uid);
      
      // Get and set the token
      const token = await user.getIdToken(true); // Force refresh to get updated claims
      setCookie('session', token, 3600);
      
      // Update last login time
      await setDoc(doc(db, 'users', user.uid), 
        { lastLogin: new Date() }, 
        { merge: true }
      );
      
      router.push('/protected/candidate/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user, create profile as candidate
        const userData: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          role: UserRole.CANDIDATE,
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
      
      // Set custom claims
      await setCustomClaims(user.uid);
      
      // Get and set the token
      const token = await user.getIdToken(true); // Force refresh to get updated claims
      setCookie('session', token, 3600);
      
      // Always redirect to candidate dashboard
      router.push('/protected/candidate/dashboard');
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
      deleteCookie('session');
      
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

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
  }), [currentUser, userProfile, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
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