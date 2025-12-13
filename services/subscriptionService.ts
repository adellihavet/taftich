
import { supabase } from './supabaseService';
import { UserProfile, PlanType } from '../types';

// --- CHARGILY CONFIGURATION ---
// هذه الروابط وهمية مؤقتاً. عليك استبدالها بروابط الدفع الحقيقية من لوحة تحكم Chargily
const CHARGILY_LINKS = {
    monthly: 'http://pay.chargily.com/payment-links/01kc71nw4ehq618fjxm23p27ky', 
    quarterly: 'http://pay.chargily.com/payment-links/01kc71mrzv8pkcp5wx9cdq0zxq',
    yearly: 'http://pay.chargily.com/payment-links/01kc71j23b103gw269bcmwf7kg'
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!supabase) return null;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
        return data as UserProfile;
    } catch (e) {
        console.error("Exception in getUserProfile:", e);
        return null;
    }
};

export const checkSubscriptionStatus = (profile: UserProfile | null): { 
    isGold: boolean; 
    isTrial: boolean; 
    daysLeft: number;
    status: 'gold' | 'trial' | 'expired' | 'pending'
} => {
    if (!profile) return { isGold: false, isTrial: false, daysLeft: 0, status: 'expired' };

    // Check Manual Pending
    if (profile.subscription_status === 'manual_pending') {
        return { isGold: false, isTrial: false, daysLeft: 0, status: 'pending' };
    }

    const now = new Date();
    
    // Check Gold (Active Subscription)
    if (profile.subscription_status === 'active' && profile.subscription_ends_at) {
        const endDate = new Date(profile.subscription_ends_at);
        if (now < endDate) {
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { isGold: true, isTrial: false, daysLeft, status: 'gold' };
        }
    }

    // Check Trial
    if (profile.trial_ends_at) {
        const trialEnd = new Date(profile.trial_ends_at);
        if (now < trialEnd) {
            const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { isGold: false, isTrial: true, daysLeft, status: 'trial' };
        }
    }

    return { isGold: false, isTrial: false, daysLeft: 0, status: 'expired' };
};

// --- PAYMENT FUNCTIONS ---

// 1. Automatic Payment (Chargily Link)
export const initiateChargilyPayment = async (plan: PlanType) => {
    const paymentUrl = CHARGILY_LINKS[plan];
    
    if (paymentUrl.includes('LINK_HERE')) {
        // Fallback for development if links are not set
        return { success: false, message: "عذراً، خدمة الدفع الآلي قيد الصيانة. يرجى استخدام الدفع اليدوي." };
    }
    
    return { success: true, url: paymentUrl };
};

// 2. Manual Payment (Upload Receipt)
export const submitManualPayment = async (file: File, plan: PlanType): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) return { success: false, message: "خطأ في الاتصال بقاعدة البيانات" };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "يرجى تسجيل الدخول أولاً" };

        // 1. Upload File
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

        // 3. Update Profile
        // ملاحظة: هذا التحديث يغير الحالة إلى 'manual_pending' لكنه يحافظ على 'subscription_ends_at' القديم في الخلفية
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'manual_pending',
                plan_type: plan,
                payment_receipt_url: publicUrl
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error: any) {
        console.error("Manual Payment Error:", error);
        return { success: false, message: error.message };
    }
};

// --- ADMIN FUNCTIONS ---

// Fetch pending requests
export const fetchPendingRequests = async (): Promise<UserProfile[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('subscription_status', 'manual_pending');

        if (error) throw error;
        return data as UserProfile[];
    } catch (e) {
        console.error("Fetch Pending Error:", e);
        return [];
    }
};

// Approve Subscription (Corrected Stacking Logic)
export const approveSubscription = async (userId: string, plan: PlanType) => {
    if (!supabase) return;
    
    try {
        // 1. جلب البيانات الحالية
        const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('subscription_status, subscription_ends_at')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const now = new Date();
        let startDate = now;

        // 2. التصحيح: نتحقق من التاريخ فقط، ونتجاهل الحالة لأنها قد تكون 'pending' حالياً
        if (currentProfile.subscription_ends_at) {
            const currentExpiry = new Date(currentProfile.subscription_ends_at);
            // إذا كان تاريخ الانتهاء القديم في المستقبل (الاشتراك لا يزال سارياً)
            if (currentExpiry.getTime() > now.getTime()) {
                startDate = currentExpiry; // نبدأ الحساب من تاريخ الانتهاء القديم
            }
        }

        // 3. حساب تاريخ الانتهاء الجديد
        const endDate = new Date(startDate);
        
        if (plan === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else if (plan === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
        else if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

        // 4. التصحيح الجمالي: تحديد نوع الخطة بناءً على المدة الإجمالية المتبقية
        // إذا كان المجموع يفوق 300 يوم، نعتبره "سنوي" حتى لو اشترى شهراً فقط للتمديد
        let finalPlanType = plan;
        const totalDurationDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (totalDurationDays > 300) {
            finalPlanType = 'yearly';
        } else if (totalDurationDays > 80) {
            finalPlanType = 'quarterly';
        }

        // 5. التحديث في قاعدة البيانات
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'active',
                subscription_ends_at: endDate.toISOString(),
                plan_type: finalPlanType, // نحفظ النوع المصحح
                // payment_receipt_url: null // اختياري: يمكن مسح الوصل بعد القبول
            })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error("Approve Error:", e);
        return { success: false };
    }
};

// Reject Subscription
export const rejectSubscription = async (userId: string) => {
    if (!supabase) return;
    try {
        // عند الرفض، نعيده للحالة السابقة.
        // المشكلة: نحن لا نعرف الحالة السابقة بدقة، لذا نفترض 'expired' إذا انتهى وقته،
        // أو 'active' إذا كان وقته ما زال سارياً.
        
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('subscription_ends_at')
            .eq('id', userId)
            .single();
            
        let newStatus = 'expired';
        if (currentProfile?.subscription_ends_at) {
            if (new Date(currentProfile.subscription_ends_at) > new Date()) {
                newStatus = 'active';
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: newStatus, 
            })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error("Reject Error:", e);
        return { success: false };
    }
};
