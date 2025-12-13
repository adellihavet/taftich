
/**
 * خدمة الاتصال بـ Google Sheets عبر Apps Script Web App
 */

export type SheetAction = 'SYNC_MAIN' | 'READ_MAIN' | 'SYNC_ACQ' | 'READ_ACQ' | 'SYNC_MAIL' | 'READ_MAIL' | 'SYNC_SEMINARS' | 'READ_SEMINARS';

// إرسال البيانات (مزامنة/حفظ)
export const syncWithScript = async (scriptUrl: string, data: any, action: SheetAction = 'SYNC_MAIN'): Promise<any> => {
    if (!scriptUrl) throw new Error("رابط السكريبت غير موجود");

    const payload = JSON.stringify({
        action: action,
        data: data
    });

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'text/plain', 
            },
            body: payload
        });

        // with no-cors, we can't check response.ok or get JSON
        // but it means request was sent.
        return { success: true };
    } catch (error) {
        console.error("فشل الاتصال بالسكربت:", error);
        throw new Error("فشل الاتصال بملف Google Sheet. تأكد من صحة الرابط.");
    }
};

// قراءة البيانات (استرجاع)
export const readFromScript = async (scriptUrl: string, action: SheetAction = 'READ_MAIN'): Promise<any> => {
    if (!scriptUrl) throw new Error("رابط السكريبت غير موجود");

    try {
        const response = await fetch(`${scriptUrl}?action=${action}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("فشل القراءة من السكربت:", error);
        throw new Error("تعذر جلب البيانات. تأكد أن السكريبت منشور بصلاحية 'Anyone' (أي شخص).");
    }
};
