import { GoogleGenAI } from "@google/genai";
import { ReportData, Teacher } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateReportAssessment = async (
  report: ReportData,
  teacher: Teacher
): Promise<string> => {
  const ai = getClient();
  if (!ai) throw new Error("API Key missing");

  // Prepare the prompt data
  const strengths = report.observations
    .filter(o => o.score === 2)
    .map(o => `${o.criteria} (${o.indicators.join(' ')})`)
    .join(", ");
    
  const weaknesses = report.observations
    .filter(o => o.score === 0 || o.score === 1)
    .map(o => `${o.criteria} (${o.indicators.join(' ')})`)
    .join(", ");

  const userGuidance = report.assessmentKeywords ? `\n    توجيهات إضافية من المفتش: ${report.assessmentKeywords}` : "";
  
  const prompt = `
    أنت مفتش تربوي خبير. قم بكتابة "التقدير العام" لتقرير تفتيش تربوي بناءً على البيانات التالية.
    
    المعلم: ${teacher.fullName}
    المادة: ${report.subject}
    الموضوع: ${report.topic}
    
    نقاط القوة الملحوظة (تم تحقيقها): ${strengths}
    نقاط تحتاج لتحسين (تحقق جزئي أو لم يتحقق): ${weaknesses}
    ${userGuidance}
    
    التعليمات:
    1. اكتب فقرة متماسكة ومهنية باللغة العربية الفصحى.
    2. ابدأ بذكر الجوانب الإيجابية وتشجيع المعلم.
    3. انتقل بلطف إلى التوجيهات والنصائح لمعالجة النقاط التي تحتاج لتحسين.
    4. خذ بعين الاعتبار التوجيهات الإضافية المقدمة أعلاه وأدمجها في السياق.
    5. استخدم مصطلحات تربوية حديثة (المقاربة بالكفاءات، التقويم التكويني، استراتيجيات التعلم النشط).
    6. اجعل النبرة بناءة وتوجيهية وليست عقابية.
    7. لا تستخدم قوائم نقطية، بل فقرات سردية كما في التقارير الرسمية.
    8. الطول: حوالي 100-150 كلمة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text || "لم يتم إنشاء نص.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("فشل في الاتصال بـ Gemini");
  }
};

export const suggestImprovement = async (criteria: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "";

    const prompt = `قدم نصيحة تربوية مختصرة جداً (جملة واحدة) لمعلم لم يحقق المعيار التالي: "${criteria}".`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text?.trim() || "";
    } catch (e) {
        return "";
    }
};