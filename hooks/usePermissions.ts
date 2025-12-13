
import { useState, useEffect } from 'react';
import { getUserProfile, checkSubscriptionStatus } from '../services/subscriptionService';
import { UserProfile } from '../types';

export const usePermissions = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [statusData, setStatusData] = useState<any>({ isGold: false, isTrial: false, daysLeft: 0, status: 'expired' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const p = await getUserProfile();
            setProfile(p);
            setStatusData(checkSubscriptionStatus(p));
            setLoading(false);
        };
        load();
    }, []);

    // --- PERMISSION GATES ---
    
    // هل الاشتراك فعال (ذهبي أو تجريبي)؟
    const isActive = statusData.isGold || statusData.isTrial;

    // هل يمكنه استخدام الذكاء الاصطناعي؟ (متاح في التجريبي والذهبي)
    const canUseAI = () => isActive;

    // هل يمكنه الطباعة؟ (متاح في التجريبي والذهبي)
    const canPrint = () => isActive;

    // هل يمكنه الوصول لقسم التثبيت؟ (متاح في التجريبي والذهبي)
    const canAccessTenure = () => true; // Always allow access to view, print is restricted
    
    // هل يمكنه استخدام المساعد الإداري؟ (يختفي عند انتهاء الصلاحية)
    const canUseAdminAssistant = () => isActive;

    return {
        loading,
        profile,
        status: statusData.status,
        daysLeft: statusData.daysLeft,
        isGold: statusData.isGold,
        isTrial: statusData.isTrial,
        isActive, // New general flag
        canUseAI,
        canPrint,
        canAccessTenure,
        canUseAdminAssistant,
        refetch: async () => {
             const p = await getUserProfile();
             setProfile(p);
             setStatusData(checkSubscriptionStatus(p));
        }
    };
};
