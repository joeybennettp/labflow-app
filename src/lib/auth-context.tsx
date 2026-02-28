'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'tech';

type AuthContextType = {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'tech',
  isAdmin: false,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(getCachedRole);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch the user's role from user_profiles and sync their email
  async function fetchRole(userId: string, userEmail?: string) {
    try {
      // Sync email into user_profiles (for team management page)
      if (userEmail) {
        await supabase
          .from('user_profiles')
          .update({ email: userEmail })
          .eq('id', userId);
      }

      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const newRole = (data?.role as UserRole) || 'tech';
      setRole(newRole);
      setCachedRole(newRole);
    } catch {
      setRole('tech');
    }
  }

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // AWAIT fetchRole so the correct role is set before rendering
          await fetchRole(currentUser.id, currentUser.email ?? undefined);
        } else {
          setRole('tech');
          setCachedRole('tech');
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

    if (!user && !isLoginPage) {
      router.push('/login');
    } else if (user && isLoginPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRole('tech');
    setCachedRole('tech');
    router.push('/login');
  }

  const isAdmin = role === 'admin';

  // Show loading spinner while checking auth + role
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
