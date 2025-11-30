
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Keyboard, Loader2 } from 'lucide-react';

interface VoiceTextareaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

const VoiceTextarea: React.FC<VoiceTextareaProps> = ({ value, onChange, placeholder, className, minHeight = "min-h-[60px]" }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ar-DZ'; // Default to Algerian Arabic, falls back to MSA

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            // We only care about the new results to append them or replace current buffer if we wanted advanced logic
            // For simplicity in this input, we track what's spoken in this session
            
            // Actually, a safer way for textareas is to just take the final results
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                // Append with a space
                const newValue = value + (value && !value.endsWith(' ') ? ' ' : '') + finalTranscript;
                onChange(newValue);
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            // Auto restart if still listening state is true (unless manually stopped)
            // For simple UX, we just stop.
            setIsListening(false);
        };
    }, [value, onChange]);

    const toggleListening = () => {
        if (!isSupported) {
            alert("متصفحك لا يدعم خاصية الإملاء الصوتي. يرجى استخدام Chrome أو Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={isListening ? "جاري الاستماع... تحدث الآن" : placeholder}
                className={`${className} ${minHeight} ${isListening ? 'border-red-400 bg-red-50/30' : ''} transition-colors pl-10`}
            />
            
            <button
                onClick={toggleListening}
                className={`absolute bottom-2 left-2 p-2 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center z-10
                    ${isListening 
                        ? 'bg-red-500 text-white animate-pulse hover:bg-red-600 scale-110' 
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                    }
                    ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={isListening ? "إيقاف التسجيل" : "تحدث للكتابة"}
                type="button"
            >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            
            {isListening && (
                <span className="absolute bottom-3 left-12 text-xs text-red-500 font-bold animate-pulse whitespace-nowrap pointer-events-none">
                    جاري التسجيل...
                </span>
            )}
        </div>
    );
};

export default VoiceTextarea;
