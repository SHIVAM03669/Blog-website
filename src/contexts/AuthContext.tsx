import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned after login');
  };

  const signUp = async (email: string, password: string, username: string) => {
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain lowercase letters, numbers, and underscores');
    }

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username // Store username in user metadata
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // Then create the profile
      const { error: profileError } = await supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) throw new Error('No session after signup');
        
        return supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      });

      if (profileError) {
        // If profile creation fails, clean up by signing out
        await supabase.auth.signOut();
        throw new Error('Failed to create profile: ' + profileError.message);
      }

    } catch (error: any) {
      // Clean up and throw error
      await supabase.auth.signOut();
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}