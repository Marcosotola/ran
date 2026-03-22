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
import { requestNotificationPermission } from './messaging-utils';

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
        // Set session cookie for proxy (former middleware)
        document.cookie = `ran_session=${firebaseUser.uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const devUid = process.env.NEXT_PUBLIC_DEV_UID;
        
        if (userDoc.exists()) {
          const data = userDoc.data() as RANUser;
          // Si el UID coincide con el dev, forzamos el rol dev y lo sincronizamos con la DB
          if (firebaseUser.uid === devUid) {
            if (data.role !== 'dev') {
              // Sincronizamos con Firestore para que las reglas de seguridad nos permitan escribir
              await setDoc(doc(db, 'users', firebaseUser.uid), { ...data, role: 'dev' }, { merge: true });
              data.role = 'dev';
            }
          }
          setRanUser(data);
        } else {
          // New user via Google — create with default 'cliente' role
          const role: UserRole = firebaseUser.uid === devUid ? 'dev' : 'cliente';
          const newUser: RANUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Usuario',
            role,
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
        // Remove session cookie
        document.cookie = `ran_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        setRanUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Sincronización automática de FCM Token ──────────────────────────────────
  useEffect(() => {
    // Solo intentamos registrar el token si el usuario está logueado 
    // y tiene un rol que requiere notificaciones (admin, vendedor, etc.)
    const rolesPrivilegiados: UserRole[] = ['admin', 'vendedor', 'secretaria', 'finanzas', 'dev'];
    
    if (ranUser && rolesPrivilegiados.includes(ranUser.role)) {
      // Pequeño delay para no interferir con la carga inicial
      const timer = setTimeout(() => {
        requestNotificationPermission(ranUser.uid, ranUser.fcmTokens);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [ranUser]);

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
