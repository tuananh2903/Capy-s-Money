import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://foxnpvitlrsqdouepdbc.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveG5wdml0bHJzcWRvdWVwZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTA2NjMsImV4cCI6MjA5Mjk2NjY2M30.inUUbYaPTkJ9yTkRhXN9AeiyjNNqDFIEU2TGIoDxmvI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
