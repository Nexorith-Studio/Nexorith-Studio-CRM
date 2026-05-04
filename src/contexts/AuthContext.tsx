import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Permission } from '../types';

const ALL_PERMISSIONS: Permission[] = [
  'view_dashboard',
  'manage_leads',
  'view_all_leads',
  'manage_clients',
  'add_client',
  'edit_client',
  'delete_client',
  'manage_team',
  'view_finance',
  'manage_finance',
  'assign_tasks'
];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isIntern: boolean;
  hasPermission: (permission: Permission) => boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          // If user exists in Auth but not in Firestore yet (e.g. first login)
          // For this specific app, we might want to auto-create profile if needed
          // but usually Admin adds them first.
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signOut = () => firebaseSignOut(auth);

  const isAdmin = ['Admin', 'Co-founder', 'CEO', 'CTO'].includes(profile?.role || '');
  const isIntern = profile?.role === 'Intern' || profile?.role === 'Sales Intern';

  const hasPermission = (permission: Permission): boolean => {
    if (isAdmin) return true; // Admins have all permissions
    return profile?.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isIntern, hasPermission, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
