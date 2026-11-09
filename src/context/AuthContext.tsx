import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.ts';
import { UserProfile, UserRole } from '../lib/types.ts';
import { logAuditEvent } from '../lib/audit.ts';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  isAdmin: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleTwoFactor: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['officialnishant8118@gmail.com', 'jonk58065@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('user');

  const getErrorMessage = (error: unknown) => {
    if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
    const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'An account already exists for this email. Please sign in instead.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/user-not-found': 'No account exists for this email. Please sign up first.',
      'auth/wrong-password': 'Email or password is incorrect.',
      'auth/weak-password': 'Choose a password with at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/popup-closed-by-user': 'The Google sign-in window was closed before completion.',
      'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups and try again.',
      'auth/unauthorized-domain': 'This domain is not enabled for sign-in in Firebase Authentication.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Authentication.',
      'auth/network-request-failed': 'Network connection failed. Check your internet and try again.',
    };
    return messages[code] || error.message;
  };

  const syncUserProfile = async (user: FirebaseUser) => {
    if (user.isAnonymous || !user.email) {
      throw new Error('Use an email account to access your wallet.');
    }

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const email = user.email.toLowerCase();
    const role: UserRole = user.emailVerified && ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
    const now = new Date().toISOString();
    let profile: UserProfile;

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      profile = {
        ...data,
        id: user.uid,
        uid: user.uid,
        email,
        displayName: user.displayName || data.displayName,
        role,
      };
      if (data.role !== role || data.email !== email) {
        await updateDoc(userRef, { role, email, updatedAt: now });
      }
    } else {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      profile = {
        id: user.uid,
        uid: user.uid,
        email,
        displayName: user.displayName || `Trader #${randomNum}`,
        role,
        userIdCode: `USR-${randomNum}`,
        referralCode: `PAY${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        twoFactorEnabled: true,
        createdAt: now,
      };
      await setDoc(userRef, profile);
      await logAuditEvent(user.uid, 'USER_REGISTERED', 'User', user.uid, `New user created with code ${profile.userIdCode}`);
    }

    const walletRef = doc(db, 'wallets', user.uid);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) {
      await setDoc(walletRef, {
        id: user.uid,
        userId: user.uid,
        inrBalance: 0,
        usdtBalance: 0,
        usdtBep20Balance: 0,
        levelIncome: 0,
        ltdIncome: 0,
        totalIncome: 0,
        updatedAt: now,
      });
    }

    setUserProfile(profile);
    setActiveRole(role);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthError(null);
      if (fbUser?.isAnonymous) {
        setCurrentUser(null);
        setUserProfile(null);
        try {
          await fbSignOut(auth);
        } catch (error) {
          console.error('Unable to end an old anonymous session:', error);
          setAuthError(getErrorMessage(error));
        }
        setLoading(false);
        return;
      }

      setCurrentUser(fbUser);
      try {
        if (fbUser) {
          await syncUserProfile(fbUser);
        } else {
          setUserProfile(null);
          setActiveRole('user');
        }
      } catch (error) {
        console.error('Unable to load the signed-in user profile:', error);
        setUserProfile(null);
        setAuthError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error) {
      const message = getErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(credential.user, { displayName: displayName.trim() });
    } catch (error) {
      const message = getErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (error) {
      const message = getErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      const message = getErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      setAuthError(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      setAuthError(getErrorMessage(error));
      throw error;
    }
  };

  const toggleTwoFactor = async () => {
    if (!userProfile) return false;
    const newState = !userProfile.twoFactorEnabled;
    const userRef = doc(db, 'users', userProfile.uid);
    await updateDoc(userRef, { twoFactorEnabled: newState, updatedAt: new Date().toISOString() });
    setUserProfile((prev) => (prev ? { ...prev, twoFactorEnabled: newState } : null));
    await logAuditEvent(
      userProfile.uid,
      newState ? '2FA_ENABLED' : '2FA_DISABLED',
      'User',
      userProfile.uid,
      'User 2FA setting modified'
    );
    return newState;
  };

  const isAdmin = !!currentUser?.emailVerified &&
    ADMIN_EMAILS.includes(currentUser.email?.toLowerCase() || '');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        isAdmin,
        activeRole,
        setActiveRole,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInWithGoogle,
        signOut,
        toggleTwoFactor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
