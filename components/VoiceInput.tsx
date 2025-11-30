import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, ChevronDown, Check, X } from 'lucide-react';

interface VoiceInputProps {
    label?: string;
    value: string;
    onChange: (val: string) => void;
    options?: string[];
    placeholder?: string;
    type?: 'text' | 'date' | 'number';
    className?: string;
    listId?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
    label, value, onChange, options = [], placeholder, type = 'text', className = ''
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    // Store position in state to avoid reading DOM during render
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [isSupported, setIsSupported] = useState(true);
    const [justOpened, setJustOpened] = useState(false);
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    
    // Stabilize ID to prevent unnecessary unmount/remount of portal
    const dropdownId = useMemo(() => 
        `dropdown-${label ? label.replace(/\s/g, '-') : Math.random().toString(36).slice(2, 11)}`,
    [label]);

    // Calculate position and update state
    const updatePosition = () => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const showAbove = spaceBelow < 250 && spaceAbove > 200; // Prefer down unless tight

            const style: React.CSSProperties = {
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                zIndex: 100000,
                // Add scrollY to top if we were using absolute relative to doc, but fixed is relative to viewport
                // So rect.top/bottom is correct for fixed.
            };

            if (showAbove) {
                style.bottom = window.innerHeight - rect.top + 5;
                style.maxHeight = Math.min(300, spaceAbove - 20);
            } else {
                style.top = rect.bottom + 5;
                style.maxHeight = Math.min(300, spaceBelow - 20);
            }
            
            setDropdownStyle(style);
        }
    };

    const handleOpen = (fromButton: boolean = false) => {
        if (options && options.length > 0) {
            updatePosition();
            setJustOpened(fromButton);
            setIsOpen(true);
        }
    };

    // Update position on scroll/resize while open
    useEffect(() => {
        if (!isOpen) return;

        const handleScrollOrResize = (e: Event) => {
            // Close on window resize/scroll to be simple and safe, 
            // or re-calculate. Closing is safer for UX on mobile.
            // But let's try to stick if it's just a small scroll. 
            // For now, close to avoid detached menus.
            
            // Exception: If scrolling inside the dropdown itself
            const dropdown = document.getElementById(dropdownId);
            if (dropdown && e.target instanceof Node && dropdown.contains(e.target)) {
                return;
            }
            setIsOpen(false);
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, dropdownId]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const isWrapper = wrapperRef.current && wrapperRef.current.contains(event.target as Node);
            const dropdown = document.getElementById(dropdownId);
            const isDropdown = dropdown && dropdown.contains(event.target as Node);

            if (!isWrapper && !isDropdown) {
                setIsOpen(false);
            }
        }
        
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, dropdownId]);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'ar-DZ';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                onChange(transcript.replace(/\.$/, ''));
            }
            setIsListening(false);
        };

        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
    }, [onChange]);

    const toggleListening = () => {
        if (!isSupported) return;
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSelectOption = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    const hasOptions = options && options.length > 0;

    const displayOptions = useMemo(() => {
        if (!hasOptions) return [];
        if (justOpened) return options;
        if (!value) return options;
        if (options.includes(value)) return options;
        const filtered = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        return filtered.length > 0 ? filtered : options;
    }, [options, value, justOpened, hasOptions]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{label}</label>}
            
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setJustOpened(false);
                        if(hasOptions) {
                            updatePosition(); // Update position when typing starts
                            setIsOpen(true);
                        }
                    }}
                    onFocus={() => {
                       // Optional: open on focus? 
                       // handleOpen(false);
                    }}
                    onClick={() => {
                        if(hasOptions) handleOpen(true);
                    }}
                    placeholder={isListening ? "جاري الاستماع..." : placeholder}
                    className={`w-full border rounded-lg py-2 px-3 pl-9 text-sm outline-none transition-all shadow-sm
                        ${isListening 
                            ? 'bg-red-50 border-red-300 ring-2 ring-red-100' 
                            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }
                        ${hasOptions ? 'cursor-pointer' : ''}
                    `}
                />
                
                <button
                    onClick={toggleListening}
                    type="button"
                    tabIndex={-1}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all z-10
                        ${isListening ? 'text-white bg-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`}
                    title="تسجيل صوتي"
                >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                {hasOptions && type !== 'date' && (
                    <button 
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isOpen) setIsOpen(false);
                            else handleOpen(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                        {isOpen ? <X size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}
            </div>

            {isOpen && hasOptions && createPortal(
                <div 
                    id={dropdownId}
                    style={dropdownStyle}
                    className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 custom-scrollbar flex flex-col"
                >
                    {displayOptions.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-400">
                            لا توجد نتائج مطابقة
                        </div>
                    ) : (
                        displayOptions.map((opt, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleSelectOption(opt)}
                                className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 flex justify-between items-center transition-colors border-b border-gray-50 last:border-0
                                    ${value === opt ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'}
                                `}
                            >
                                <span className="truncate">{opt}</span>
                                {value === opt && <Check size={14} className="shrink-0 ml-2" />}
                            </div>
                        ))
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default VoiceInput;