import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL !== 'undefined')
  ? process.env.EXPO_PUBLIC_SUPABASE_URL
  : 'https://foxnpvitlrsqdouepdbc.supabase.co';

const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'undefined')
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveG5wdml0bHJzcWRvdWVwZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTA2NjMsImV4cCI6MjA5Mjk2NjY2M30.inUUbYaPTkJ9yTkRhXN9AeiyjNNqDFIEU2TGIoDxmvI';

console.log('INIT SUPABASE URL:', supabaseUrl, 'ENV_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

// LargeSecureStore: Chia value lớn thành chunks 1800-byte để lưu qua iOS Keychain (SecureStore giới hạn 2048 byte/entry)
// Fallback sang AsyncStorage trên Web/Android (nơi SecureStore không available)
const CHUNK_SIZE = 1800;

class LargeSecureStore {
  private async _saveChunks(key: string, value: string): Promise<void> {
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__count`, String(chunks));
    for (let i = 0; i < chunks; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunk);
    }
  }

  private async _loadChunks(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}__count`);
    if (!countStr) return null;
    const count = parseInt(countStr, 10);
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  }

  private async _deleteChunks(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}__count`);
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    await SecureStore.deleteItemAsync(`${key}__count`);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this._loadChunks(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await this._saveChunks(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this._deleteChunks(key);
  }
}

// Dùng LargeSecureStore (iOS Keychain) trên native, window.localStorage trên Web
const storageAdapter = Platform.OS === 'web'
  ? (typeof window !== 'undefined' ? window.localStorage : undefined)
  : new LargeSecureStore();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // Web (PWA): phải bật để Supabase tự đọc access_token từ URL hash sau OAuth redirect
    // Native: tắt vì App.tsx deep link handler xử lý việc này
    detectSessionInUrl: Platform.OS === 'web',
  },
});
