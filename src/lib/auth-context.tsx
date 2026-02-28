'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'tech' | 'doctor';

type AuthContextType = {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  isDoctor: boolean;
  doctorId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'tech',
  isAdmin: false,
  isDoctor: false,
  doctorId: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Cache role in localStorage to avoid flicker on subsequent loads
function getCachedRole(): UserRole {
  if (typeof window === 'undefined') return 'tech';
  return (localStorage.getItem('labflow-role') as UserRole) || 'tech';
}

function setCachedRole(role: UserRole) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('labflow-role', role);
  }
}

function getCachedDoctorId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('labflow-doctor-id');
}

function setCachedDoctorId(id: string | null) {
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem('labflow-doctor-id', id);
    } else {
      localStorage.removeItem('labflow-doctor-id');
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(getCachedRole);
  const [doctorId, setDoctorId] = useState<string | null>(getCachedDoctorId);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch the user's role from user_profiles and sync their email
  async function fetchRole(userId: string, userEmail?: string, retry = true) {
    try {
      // Sync email into user_profiles (for team management page)
      if (userEmail) {
        supabase
          .from('user_profiles')
          .update({ email: userEmail })
          .eq('id', userId)
          .then(() => {}); // fire-and-forget, don't block role fetch
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Auth token might not be ready yet — retry once after a short delay
        if (retry) {
          await new Promise((r) => setTimeout(r, 500));
          return fetchRole(userId, undefined, false);
        }
        // If retry also failed, keep whatever is cached — don't overwrite with 'tech'
        return;
      }

      const newRole = (data.role as UserRole) || 'tech';
      setRole(newRole);
      setCachedRole(newRole);

      // If doctor, fetch the linked doctor record ID
      if (newRole === 'doctor') {
        const { data: docData } = await supabase
          .from('doctors')
          .select('id')
          .eq('auth_user_id', userId)
          .single();
        if (docData) {
          setDoctorId(docData.id);
          setCachedDoctorId(docData.id);
        }
      } else {
        setDoctorId(null);
        setCachedDoctorId(null);
      }
    } catch {
      // Network error — keep cached role, don't overwrite
    }
  }

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fire in background — cached role renders instantly,
          // fetchRole updates it (and the cache) once it resolves.
          fetchRole(currentUser.id, currentUser.email ?? undefined);
        } else {
          setRole('tech');
          setCachedRole('tech');
          setDoctorId(null);
          setCachedDoctorId(null);
        }

        setLoading(false);
      }
    );

    // Safety timeout — if auth never resolves, stop loading after 3s
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Redirect logic
  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === '/login';
    const isRegisterPage = pathname === '/portal/register';
    const isPortalPage = pathname.startsWith('/portal');

    if (!user && !isLoginPage && !isRegisterPage) {
      router.push('/login');
    } else if (user && isLoginPage) {
      // Role-based redirect from login
      router.push(role === 'doctor' ? '/portal' : '/');
    } else if (user && role === 'doctor' && !isPortalPage) {
      // Doctors can only access /portal/*
      router.push('/portal');
    } else if (user && role !== 'doctor' && isPortalPage && !isRegisterPage) {
      // Non-doctors should not be on /portal (but registration is public)
      router.push('/');
    }
  }, [user, role, loading, pathname, router]);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRole('tech');
    setCachedRole('tech');
    setDoctorId(null);
    setCachedDoctorId(null);
    router.push('/login');
  }

  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';

  // Show loading spinner while checking auth + role
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, isDoctor, doctorId, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
