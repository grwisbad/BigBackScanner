/**
 * CSV Store — CALTRC
 *
 * Reads/writes food log entries to a CSV file.
 * File: data/food_log.csv
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CSV_PATH = path.join(DATA_DIR, 'food_log.csv');
const HEADERS = 'id,date,name,calories,protein,carbs,fat,loggedAt';

/**
 * Ensure the data directory and CSV file exist.
 */
function ensureFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CSV_PATH)) {
        fs.writeFileSync(CSV_PATH, HEADERS + '\n', 'utf8');
    }
}

/**
 * Escape a CSV field (wrap in quotes if it contains commas or quotes).
 */
function escapeField(val) {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Parse a CSV line respecting quoted fields.
 */
function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current);
    return fields;
}

/**
 * Load all entries, optionally filtered by date (YYYY-MM-DD).
 * @param {string} [date] - Filter by this date
 * @returns {Object[]}
 */
function loadEntries(date) {
    ensureFile();
    const raw = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = raw.split('\n').filter((l) => l.trim() !== '');

    if (lines.length <= 1) return []; // header only

    const entries = [];
    for (let i = 1; i < lines.length; i++) {
        const fields = parseLine(lines[i]);
        if (fields.length < 8) continue;

        const entry = {
            id: fields[0],
            date: fields[1],
            name: fields[2],
            calories: Number(fields[3]),
            protein: Number(fields[4]),
            carbs: Number(fields[5]),
            fat: Number(fields[6]),
            loggedAt: fields[7],
        };

        if (!date || entry.date === date) {
            entries.push(entry);
        }
    }

    return entries;
}

/**
 * Append a food entry to the CSV.
 * @param {Object} entry - { id, date, name, calories, protein, carbs, fat, loggedAt }
 */
function appendEntry(entry) {
    ensureFile();
    const row = [
        entry.id,
        entry.date,
        escapeField(entry.name),
        entry.calories,
        entry.protein,
        entry.carbs,
        entry.fat,
        entry.loggedAt,
    ].join(',');

    fs.appendFileSync(CSV_PATH, row + '\n', 'utf8');
}

/**
 * Compute daily totals for a set of entries.
 * @param {Object[]} entries
 * @returns {{ calories: number, protein: number, carbs: number, fat: number }}
 */
function computeTotals(entries) {
    return entries.reduce(
        (t, e) => ({
            calories: t.calories + e.calories,
            protein: +(t.protein + e.protein).toFixed(1),
            carbs: +(t.carbs + e.carbs).toFixed(1),
            fat: +(t.fat + e.fat).toFixed(1),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
}

module.exports = {
    loadEntries,
    appendEntry,
    computeTotals,
    ensureFile,
    CSV_PATH,
    DATA_DIR,
};
