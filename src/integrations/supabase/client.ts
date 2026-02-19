import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// FONTOS: Tegyünk ide egy ellenőrzést, hogy lássuk, mit kap a rendszer!
console.log("Supabase URL a futáskor:", SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Hiányoznak a Supabase környezeti változók a Lovable beállításaiból!");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
