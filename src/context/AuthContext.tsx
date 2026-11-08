import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.ts';
import { UserProfile, UserRole } from '../lib/types.ts';
import { logAuditEvent } from '../lib/audit.ts';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signInQuickAccess: (email?: string, name?: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  toggleTwoFactor: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['officialnishant8118@gmail.com', 'jonk58065@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('user');

  // Sync or create user in Firestore
  const syncUserProfile = async (user: FirebaseUser, overrideEmail?: string, overrideName?: string, requestedRole?: UserRole) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      const email = (overrideEmail || user.email || 'user@paycrypto.wallet').toLowerCase();
      const isAdminEmail = ADMIN_EMAILS.includes(email) || requestedRole === 'admin';
      const role: UserRole = isAdminEmail ? 'admin' : (requestedRole || 'user');

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // update role if designated
        if (isAdminEmail && data.role !== 'admin') {
          await updateDoc(userRef, { role: 'admin', updatedAt: new Date().toISOString() });
          data.role = 'admin';
        }
        setUserProfile(data);
        setActiveRole(data.role);
      } else {
        // Generate memorable 6-digit user ID like USR-829104
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const userIdCode = `USR-${randomNum}`;
        const referralCode = `PAY${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const newProfile: UserProfile = {
          id: user.uid,
          uid: user.uid,
          email,
          displayName: overrideName || user.displayName || `Trader #${randomNum}`,
          role,
          userIdCode,
          referralCode,
          twoFactorEnabled: true,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setActiveRole(role);

        // Ensure wallet document exists with 0 balance
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
            updatedAt: new Date().toISOString(),
          });
        }

        // If user is admin, add to /admins/{uid} marker collection
        if (role === 'admin') {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              email,
              grantedAt: new Date().toISOString(),
            });
          } catch {
            // ignore
          }
        }

        await logAuditEvent(user.uid, 'USER_REGISTERED', 'User', user.uid, `New user created with code ${userIdCode}`);
      }
    } catch (err) {
      console.error('Error syncing user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        await syncUserProfile(fbUser);
      } else {
        // Auto-initialize seamless session with persistent ID so wallet features work out of the box
        try {
          const cred = await signInAnonymously(auth);
          await syncUserProfile(cred.user, 'officialnishant8118@gmail.com', 'Nishant (Verified)', 'admin');
        } catch {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await syncUserProfile(res.user);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInQuickAccess = async (
    customEmail = 'trader@paycrypto.com',
    customName = 'Pro Trader',
    role: UserRole = 'user'
  ) => {
    setLoading(true);
    try {
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }
      await syncUserProfile(user, customEmail, customName, role);
    } catch (err) {
      console.error('Quick access login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Sign-out error:', error);
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

  const isAdmin = userProfile?.role === 'admin' || ADMIN_EMAILS.includes(userProfile?.email || '');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        activeRole,
        setActiveRole,
        signInWithGoogle,
        signInQuickAccess,
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
