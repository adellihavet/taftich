
import { MailRecord } from '../types';

const MAIL_DB_KEY = 'mufattish_mail_register';

const getDB = (): MailRecord[] => {
    const data = localStorage.getItem(MAIL_DB_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const saveDB = (records: MailRecord[]) => {
    localStorage.setItem(MAIL_DB_KEY, JSON.stringify(records));
};

// Calculate next number for a specific year and type
export const getNextMailNumber = (type: 'incoming' | 'outgoing', year: number): string => {
    const records = getDB();
    
    // Filter records for same type and year, ensuring we only count valid numbers
    const relevantRecords = records.filter(r => 
        r.type === type && 
        r.year === year && 
        !isNaN(parseInt(r.number)) // Exclude "بدون رقم"
    );

    if (relevantRecords.length === 0) return "01";

    // Find max number
    let max = 0;
    relevantRecords.forEach(r => {
        const num = parseInt(r.number);
        if (num > max) max = num;
    });

    return String(max + 1).padStart(2, '0');
};

export const addMailRecord = (
    type: 'incoming' | 'outgoing',
    correspondent: string,
    subject: string,
    isNoNumber: boolean = false,
    reference?: string // For incoming primarily
): MailRecord => {
    const today = new Date();
    const year = today.getFullYear();
    const dateStr = today.toISOString().split('T')[0];

    // Auto-calculate number
    let number = "بدون رقم";
    if (!isNoNumber) {
        number = getNextMailNumber(type, year);
    }

    const newRecord: MailRecord = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        year,
        date: dateStr,
        number,
        correspondent,
        subject,
        reference: reference || ''
    };

    const records = getDB();
    records.push(newRecord);
    saveDB(records);

    return newRecord;
};

export const getMailRecords = (type?: 'incoming' | 'outgoing'): MailRecord[] => {
    const records = getDB();
    if (type) {
        return records.filter(r => r.type === type).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteMailRecord = (id: string) => {
    const records = getDB();
    const newRecords = records.filter(r => r.id !== id);
    saveDB(newRecords);
};

// Update an existing record (e.g. editing notes)
export const updateMailRecord = (record: MailRecord) => {
    const records = getDB();
    const index = records.findIndex(r => r.id === record.id);
    if (index !== -1) {
        records[index] = record;
        saveDB(records);
    }
};