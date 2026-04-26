import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://vosbykmmrfcyrdrkvinx.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2J5a21tcmZjeXJkcmt2aW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjI0NzYsImV4cCI6MjA5MTk5ODQ3Nn0.YcVY4b7OlwvLJV3_JvmnZ6xbrnTa8cC96SOrm_4laBw";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || defaultSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);