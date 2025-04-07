// Важно: сначала импортируем полифил URL
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

// Настоящие данные подключения к Supabase
const supabaseUrl = 'https://bondvgkachyjxqxsrcvj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbmR2Z2thY2h5anhxeHNyY3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MDUzMzMsImV4cCI6MjA1NTQ4MTMzM30.YbfRCbi21MrRI_GJM3Y08f0g-CfHWMTZCQXrSiq3ga4';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
