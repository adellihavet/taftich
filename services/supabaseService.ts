import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// ملاحظة هامة: يجب تثبيت المكتبة في مشروعك المحلي عبر الأمر:
// npm install @supabase/supabase-js
// ------------------------------------------------------------------

// إعدادات الاتصال بـ Supabase (نظام الحسابات فقط)
// يفضل وضع هذه القيم في ملف .env باسم VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
// أو يمكنك وضعها مباشرة هنا كحل مؤقت.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://voqxebgaebmmijvzcaun.supabase.co"; 
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvcXhlYmdhZWJtbWlqdnpjYXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTQ3MzUsImV4cCI6MjA3OTU3MDczNX0.NPN6zGNVSJYmZloosWL_s-dTogxpLjpgKH8w1e6E3Os";

let supabaseClient: any = null;

const initSupabase = () => {
  // التحقق من وجود القيم، وإذا كانت فارغة أو تحتوي على نصوص افتراضية نعتبرها غير مهيأة
  const isConfigured = 
    SUPABASE_URL && 
    SUPABASE_URL !== "" && 
    !SUPABASE_URL.includes("ضع_رابط") &&
    SUPABASE_ANON_KEY && 
    SUPABASE_ANON_KEY !== "" &&
    !SUPABASE_ANON_KEY.includes("ضع_المفتاح");

  if (!isConfigured) {
    console.warn('Supabase is not configured. Auth will be disabled.');
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