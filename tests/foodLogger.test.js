/**
 * Unit Tests — Food Logger (USDA FDC)
 */

const DataStore = require('../src/dataStore');
const { searchFood, logFood, getTodayLog, NUTRIENT_IDS } = require('../src/foodLogger');
const foodEntryFixture = require('./fixtures/foodEntry.json');

// Mock USDA response
const mockUsdaResponse = {
    foods: [
        {
            fdcId: 171077,
            description: 'Chicken breast, raw',
            brandOwner: null,
            servingSize: 100,
            servingSizeUnit: 'g',
            foodNutrients: [
                { nutrientId: NUTRIENT_IDS.ENERGY, value: 120 },
                { nutrientId: NUTRIENT_IDS.PROTEIN, value: 22.5 },
                { nutrientId: NUTRIENT_IDS.CARBS, value: 0 },
                { nutrientId: NUTRIENT_IDS.FAT, value: 2.6 },
            ],
        },
        {
            fdcId: 171078,
            description: 'Chicken thigh, raw',
            brandOwner: 'Some Brand',
            foodNutrients: [
                { nutrientId: NUTRIENT_IDS.ENERGY, value: 177 },
                { nutrientId: NUTRIENT_IDS.PROTEIN, value: 19.7 },
                { nutrientId: NUTRIENT_IDS.CARBS, value: 0 },
                { nutrientId: NUTRIENT_IDS.FAT, value: 10.2 },
            ],
        },
    ],
};

describe('Food Logger', () => {
    let store;

    beforeEach(() => {
        store = new DataStore();
    });

    // --- searchFood ---

    describe('searchFood', () => {
        test('returns parsed food results from USDA API', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve(mockUsdaResponse),
            });

            const results = await searchFood('chicken', mockFetch);
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Chicken breast, raw');
            expect(results[0].calories).toBe(120);
            expect(results[0].protein).toBe(22.5);
            expect(results[0].carbs).toBe(0);
            expect(results[0].fat).toBe(2.6);
            expect(results[0].fdcId).toBe(171077);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        test('includes brand when available', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve(mockUsdaResponse),
            });

            const results = await searchFood('chicken', mockFetch);
            expect(results[0].brand).toBeNull();
            expect(results[1].brand).toBe('Some Brand');
        });

        test('returns empty array for no results', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ foods: [] }),
            });

            const results = await searchFood('xyznonexistent', mockFetch);
            expect(results).toEqual([]);
        });

        test('returns empty array on API error', async () => {
            const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const results = await searchFood('chicken', mockFetch);
            expect(results).toEqual([]);
        });
    });

    // --- logFood ---

    describe('logFood', () => {
        test('creates a valid food entry with all fields', () => {
            const entry = logFood('user-001', foodEntryFixture, store);

            expect(entry.userId).toBe('user-001');
            expect(entry.name).toBe('Nutella');
            expect(entry.calories).toBe(539);
            expect(entry.protein).toBe(6.3);
            expect(entry.carbs).toBe(57.5);
            expect(entry.fat).toBe(30.9);
            expect(entry.loggedAt).toBeDefined();
            expect(entry.id).toBeDefined();
        });

        test('stores the entry in the data store', () => {
            logFood('user-001', foodEntryFixture, store);
            const today = new Date().toISOString().split('T')[0];
            const entries = store.getFoodEntriesByUser('user-001', today);
            expect(entries).toHaveLength(1);
        });

        test('handles manual entry without barcode', () => {
            const manualEntry = {
                name: 'Salad',
                calories: 150,
                protein: 5,
                carbs: 20,
                fat: 7,
            };
            const entry = logFood('user-001', manualEntry, store);
            expect(entry.barcode).toBeNull();
            expect(entry.name).toBe('Salad');
        });
    });

    // --- getTodayLog ---

    describe('getTodayLog', () => {
        test('returns empty array when no food logged today', () => {
            const log = getTodayLog('user-001', store);
            expect(log).toEqual([]);
        });

        test('returns today\'s entries for the user', () => {
            logFood('user-001', foodEntryFixture, store);
            logFood('user-001', { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 }, store);

            const log = getTodayLog('user-001', store);
            expect(log).toHaveLength(2);
        });

        test('does not include other users\' entries', () => {
            logFood('user-001', foodEntryFixture, store);
            logFood('user-002', foodEntryFixture, store);

            const log = getTodayLog('user-001', store);
            expect(log).toHaveLength(1);
            expect(log[0].userId).toBe('user-001');
        });
    });
});
