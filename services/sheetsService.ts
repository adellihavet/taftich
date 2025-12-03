
/**
 * خدمة الاتصال بـ Google Sheets عبر Apps Script Web App
 */

// إرسال البيانات (مزامنة/حفظ)
export const syncWithScript = async (scriptUrl: string, data: any): Promise<any> => {
    if (!scriptUrl) throw new Error("رابط السكريبت غير موجود");

    const payload = JSON.stringify({
        action: 'SYNC',
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

        return { success: true };
    } catch (error) {
        console.error("فشل الاتصال بالسكربت:", error);
        throw new Error("فشل الاتصال بملف Google Sheet. تأكد من صحة الرابط.");
    }
};

// قراءة البيانات (استرجاع)
export const readFromScript = async (scriptUrl: string): Promise<any> => {
    if (!scriptUrl) throw new Error("رابط السكريبت غير موجود");

    try {
        const response = await fetch(`${scriptUrl}?action=READ`, {
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

export const openSheetFromUrl = (scriptUrl: string) => {
    alert("يرجى فتح ملف Google Sheet يدوياً من حسابك في Google Drive.");
};
