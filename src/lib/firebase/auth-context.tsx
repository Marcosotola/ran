'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { RANUser, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  ranUser: RANUser | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ranUser, setRanUser] = useState<RANUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setRanUser(userDoc.data() as RANUser);
        } else {
          // New user via Google — create with default 'cliente' role
          const newUser: RANUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Usuario',
            role: 'cliente',
            createdAt: new Date(),
            isActive: true,
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
          });
          setRanUser(newUser);
        }
      } else {
        setRanUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const newUser: RANUser = {
      uid: cred.user.uid,
      email,
      displayName,
      role: 'cliente',
      createdAt: new Date(),
      isActive: true,
    };
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
    });
    setRanUser(newUser);
  };

  const logOut = async () => {
    await signOut(auth);
    setRanUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ranUser,
        role: ranUser?.role ?? null,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Role guards
export function hasRole(role: UserRole | null, allowed: UserRole[]): boolean {
  if (!role) return false;
  if (role === 'admin' || role === 'dev') return true;
  return allowed.includes(role);
}
