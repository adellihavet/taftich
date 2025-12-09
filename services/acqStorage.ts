
import { AcqClassRecord, AcquisitionsDB, AcquisitionsGlobalDB, AcqGlobalRecord } from '../types/acquisitions';

const DB_KEY = 'mufattish_acq_db';
const GLOBAL_DB_KEY = 'mufattish_acq_global_db';

// --- DETAILED GRID STORAGE ---

export const getAcqDB = (): AcquisitionsDB => {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return { records: [] };
    try {
        return JSON.parse(data);
    } catch {
        return { records: [] };
    }
};

export const saveAcqRecord = (record: AcqClassRecord) => {
    const db = getAcqDB();
    const existingIdx = db.records.findIndex(r => r.id === record.id);
    if (existingIdx >= 0) {
        db.records[existingIdx] = record;
    } else {
        db.records.push(record);
    }
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const deleteAcqRecord = (recordId: string) => {
    const db = getAcqDB();
    db.records = db.records.filter(r => r.id !== recordId);
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// --- GLOBAL GRID STORAGE (NEW) ---

export const getGlobalAcqDB = (): AcquisitionsGlobalDB => {
    const data = localStorage.getItem(GLOBAL_DB_KEY);
    if (!data) return { records: [] };
    try {
        return JSON.parse(data);
    } catch {
        return { records: [] };
    }
};

export const saveGlobalAcqRecord = (record: AcqGlobalRecord) => {
    const db = getGlobalAcqDB();
    // Check if school already exists, update it
    const existingIdx = db.records.findIndex(r => r.schoolName === record.schoolName);
    if (existingIdx >= 0) {
        db.records[existingIdx] = record;
    } else {
        db.records.push(record);
    }
    localStorage.setItem(GLOBAL_DB_KEY, JSON.stringify(db));
};

export const deleteGlobalAcqRecord = (recordId: string) => {
    const db = getGlobalAcqDB();
    db.records = db.records.filter(r => r.id !== recordId);
    localStorage.setItem(GLOBAL_DB_KEY, JSON.stringify(db));
};
