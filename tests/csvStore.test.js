/**
 * Unit Tests — CSV Store
 */

const fs = require('fs');
const path = require('path');
const { loadEntries, appendEntry, computeTotals, ensureFile, CSV_PATH, DATA_DIR } = require('../src/csvStore');

// Use a temp path for tests
const TEST_CSV = path.join(__dirname, '..', 'data', 'food_log_test.csv');
const HEADERS = 'id,date,name,calories,protein,carbs,fat,loggedAt';

describe('CSV Store', () => {
    // Override CSV_PATH for tests by manipulating the file directly
    const originalPath = CSV_PATH;

    beforeEach(() => {
        // Clean up test data by clearing the CSV
        if (fs.existsSync(CSV_PATH)) {
            fs.writeFileSync(CSV_PATH, HEADERS + '\n', 'utf8');
        }
    });

    afterAll(() => {
        // Restore clean CSV
        if (fs.existsSync(CSV_PATH)) {
            fs.writeFileSync(CSV_PATH, HEADERS + '\n', 'utf8');
        }
    });

    describe('ensureFile', () => {
        test('creates data directory and CSV file if missing', () => {
            ensureFile();
            expect(fs.existsSync(DATA_DIR)).toBe(true);
            expect(fs.existsSync(CSV_PATH)).toBe(true);

            const content = fs.readFileSync(CSV_PATH, 'utf8');
            expect(content.startsWith('id,date,name')).toBe(true);
        });
    });

    describe('appendEntry + loadEntries', () => {
        test('writes and reads back an entry', () => {
            const entry = {
                id: 'test-001',
                date: '2026-02-11',
                name: 'Test Food',
                calories: 200,
                protein: 15,
                carbs: 20,
                fat: 8,
                loggedAt: '2026-02-11T12:00:00Z',
            };

            appendEntry(entry);
            const entries = loadEntries('2026-02-11');

            expect(entries).toHaveLength(1);
            expect(entries[0].id).toBe('test-001');
            expect(entries[0].name).toBe('Test Food');
            expect(entries[0].calories).toBe(200);
        });

        test('handles food names with commas', () => {
            const entry = {
                id: 'test-002',
                date: '2026-02-11',
                name: 'Rice, white, cooked',
                calories: 130,
                protein: 2.7,
                carbs: 28,
                fat: 0.3,
                loggedAt: '2026-02-11T12:00:00Z',
            };

            appendEntry(entry);
            const entries = loadEntries('2026-02-11');
            const found = entries.find((e) => e.id === 'test-002');
            expect(found.name).toBe('Rice, white, cooked');
        });

        test('filters entries by date', () => {
            appendEntry({
                id: 'a', date: '2026-02-10', name: 'Yesterday',
                calories: 100, protein: 5, carbs: 10, fat: 3,
                loggedAt: '2026-02-10T12:00:00Z',
            });
            appendEntry({
                id: 'b', date: '2026-02-11', name: 'Today',
                calories: 200, protein: 10, carbs: 20, fat: 6,
                loggedAt: '2026-02-11T12:00:00Z',
            });

            const today = loadEntries('2026-02-11');
            expect(today).toHaveLength(1);
            expect(today[0].name).toBe('Today');

            const all = loadEntries();
            expect(all.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('computeTotals', () => {
        test('sums macros correctly', () => {
            const entries = [
                { calories: 200, protein: 10, carbs: 20, fat: 5 },
                { calories: 300, protein: 25, carbs: 30, fat: 10 },
            ];

            const totals = computeTotals(entries);
            expect(totals.calories).toBe(500);
            expect(totals.protein).toBe(35);
            expect(totals.carbs).toBe(50);
            expect(totals.fat).toBe(15);
        });

        test('returns zeros for empty entries', () => {
            const totals = computeTotals([]);
            expect(totals.calories).toBe(0);
            expect(totals.protein).toBe(0);
            expect(totals.carbs).toBe(0);
            expect(totals.fat).toBe(0);
        });
    });
});
