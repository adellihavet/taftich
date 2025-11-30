import React from 'react';
import { Crown, Check, X, Star, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-white/80 hover:text-white z-10 p-1 bg-black/20 rounded-full"
        >
          <X size={20} />
        </button>

        {/* Header with Gold Gradient */}
        <div className="bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-8 text-center relative overflow-hidden">
            {/* Background sparkles */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <Sparkles className="absolute top-4 right-10 animate-pulse" size={20} />
                <Sparkles className="absolute bottom-4 left-10 animate-pulse delay-700" size={30} />
                <Sparkles className="absolute top-10 left-1/2 animate-pulse delay-300" size={15} />
            </div>

            <div className="relative z-10 flex flex-col items-center text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner border border-white/30">
                    <Crown size={32} className="text-white drop-shadow-md" fill="currentColor" />
                </div>
                <h2 className="text-3xl font-bold mb-1 drop-shadow-sm">العضوية الذهبية</h2>
                <p className="text-yellow-50 font-medium opacity-90">افتح قوة الذكاء الاصطناعي</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-8">
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="font-medium">توليد تقارير كاملة بالذكاء الاصطناعي</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="font-medium">اقتراحات ذكية لتحسين النقاط الضعيفة</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="font-medium">صياغة تربوية احترافية للتقدير العام</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="font-medium">أولوية في سرعة المعالجة</span>
                </div>
            </div>

            <button 
                onClick={onUpgrade}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
            >
                <Star className="text-yellow-400 group-hover:animate-spin" fill="currentColor" size={20} />
                <span>اشترك الآن - مجاناً للتجربة</span>
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
                يمكنك إلغاء الاشتراك في أي وقت.
            </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;