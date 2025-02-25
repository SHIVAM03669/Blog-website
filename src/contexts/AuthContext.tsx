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
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user) {
      throw new Error('No user returned after login');
    }

    // Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      throw new Error('Profile not found. Please register a new account.');
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Validate username
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('Username is already taken');
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw new Error('Error checking username availability');
    }

    // Create auth user
    const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw new Error(signUpError.message);

    if (!data.user) {
      throw new Error('Failed to create account');
    }

    try {
      // Create profile with retries
      let retries = 3;
      let profileError = null;

      while (retries > 0) {
        const { error } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            username,
            created_at: new Date().toISOString()
          }]);
        
        if (!error) {
          return; // Success
        }
        
        profileError = error;
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }

      // If all retries failed
      await supabase.auth.signOut();
      throw new Error(`Failed to create profile after multiple attempts: ${profileError?.message}`);
    } catch (error: any) {
      // Clean up: sign out and throw error
      await supabase.auth.signOut();
      throw new Error('Failed to create profile: ' + error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
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