// Create Supabase client instance
import { createClient } from '@supabase/supabase-js';

// Environment variables from .env file:
// VITE_SUPABASE_URL: Your Supabase project URL
// VITE_SUPABASE_ANON_KEY: Your Supabase project's anon/public key
const supabaseUrl = 'https://lxlyhrcstpevrsweaiyl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bHlocmNzdHBldnJzd2VhaXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyODYzNjMsImV4cCI6MjA1NTg2MjM2M30.x1Ke2dGXANJT6TzuZtD1022zGftJRK9xok4BoRLmbg0';

// Initialize the Supabase client with project credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey);