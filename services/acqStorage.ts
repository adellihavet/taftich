
import { AcqClassRecord, AcquisitionsDB } from '../types/acquisitions';

const DB_KEY = 'mufattish_acq_db';

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
    // Check if record exists (by ID), update it, otherwise add new
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
