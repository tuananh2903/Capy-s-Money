import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL !== 'undefined')
  ? process.env.EXPO_PUBLIC_SUPABASE_URL
  : 'https://foxnpvitlrsqdouepdbc.supabase.co';

const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'undefined')
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveG5wdml0bHJzcWRvdWVwZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTA2NjMsImV4cCI6MjA5Mjk2NjY2M30.inUUbYaPTkJ9yTkRhXN9AeiyjNNqDFIEU2TGIoDxmvI';

console.log('INIT SUPABASE URL:', supabaseUrl, 'ENV_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
