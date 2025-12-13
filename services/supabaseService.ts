
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// ملاحظة هامة: يجب تثبيت المكتبة في مشروعك المحلي عبر الأمر:
// npm install @supabase/supabase-js
// ------------------------------------------------------------------

// إعدادات الاتصال بـ Supabase (نظام الحسابات فقط)
// قمنا بإزالة القيم الافتراضية المعطلة. يرجى وضع روابط مشروعك الخاص هنا
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ujcnhgjuttusqavhxjnb.supabase.co"; 
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY25oZ2p1dHR1c3Fhdmh4am5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDY4NDksImV4cCI6MjA4MDUyMjg0OX0.jejG8c2HTTIMd53shlX5mmgNAF9D8H98Z0x5VYeH22c";

let supabaseClient: any = null;

const initSupabase = () => {
  const isConfigured = 
    SUPABASE_URL && 
    SUPABASE_URL.trim() !== "" && 
    !SUPABASE_URL.includes("ضع_رابط") &&
    SUPABASE_ANON_KEY && 
    SUPABASE_ANON_KEY.trim() !== "" &&
    !SUPABASE_ANON_KEY.includes("ضع_المفتاح");

  if (!isConfigured) {
    // console.warn('Supabase is not configured. Auth will be disabled.');
    return null;
  }

  try {
    if (!supabaseClient) {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true, // حفظ جلسة الدخول في المتصفح
          autoRefreshToken: true,
        }
      });
    }
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

export const supabase = initSupabase();

export const isSupabaseConfigured = (): boolean => {
    return !!supabase;
};

// Fetch script URL from user metadata
export const fetchScriptUrlFromCloud = async (): Promise<string | null> => {
    if (!supabase) return null;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.script_url) {
            return user.user_metadata.script_url;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch script URL", e);
        return null;
    }
};

// Save script URL to user metadata
export const saveScriptUrlToCloud = async (url: string) => {
    if (!supabase) return;
    try {
        await supabase.auth.updateUser({
            data: { script_url: url }
        });
    } catch (e) {
        console.error("Failed to save script URL", e);
    }
};

// Update User Password
export const updateUserPassword = async (newPassword: string) => {
    if (!supabase) return { error: { message: "غير متصل بقاعدة البيانات" } };
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        return { data, error };
    } catch (e: any) {
        return { error: e };
    }
};

// --- CONTENT MANAGEMENT (SEMINARS) ---

export interface RemoteSeminar {
    id: string;
    title: string;
    url: string;
    color: string;
    is_interactive?: boolean; // New Field
    created_at?: string;
}

export const fetchSeminars = async (): Promise<RemoteSeminar[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('public_seminars')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data as RemoteSeminar[];
    } catch (e) {
        console.error("Error fetching seminars:", e);
        return [];
    }
};

export const addSeminar = async (seminar: Omit<RemoteSeminar, 'id' | 'created_at'>) => {
    if (!supabase) return { error: { message: "غير متصل" } };
    try {
        const { data, error } = await supabase
            .from('public_seminars')
            .insert([seminar])
            .select();
        return { data, error };
    } catch (e: any) {
        return { error: e };
    }
};

export const deleteSeminar = async (id: string) => {
    if (!supabase) return { error: { message: "غير متصل" } };
    try {
        const { error } = await supabase
            .from('public_seminars')
            .delete()
            .eq('id', id);
        return { error };
    } catch (e: any) {
        return { error: e };
    }
};
