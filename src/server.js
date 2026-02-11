/**
 * Express Server — CALTRC
 *
 * Serves the frontend and provides API routes for food logging.
 */

const express = require('express');
const path = require('path');
const { searchFood, generateId } = require('./foodLogger');
const { loadEntries, appendEntry, computeTotals } = require('./csvStore');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * GET /api/food/search?q=...
 * Search USDA FoodData Central.
 */
app.get('/api/food/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
        return res.json({ results: [] });
    }

    try {
        const results = await searchFood(query.trim());
        res.json({ results });
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * POST /api/log
 * Add a food entry to the CSV.
 * Body: { name, calories, protein, carbs, fat }
 */
app.post('/api/log', (req, res) => {
    const { name, calories, protein, carbs, fat } = req.body;

    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Food name is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const entry = {
        id: generateId(),
        date: today,
        name: name.trim(),
        calories: Number(calories) || 0,
        protein: +(Number(protein) || 0).toFixed(1),
        carbs: +(Number(carbs) || 0).toFixed(1),
        fat: +(Number(fat) || 0).toFixed(1),
        loggedAt: new Date().toISOString(),
    };

    try {
        appendEntry(entry);
        res.status(201).json({ entry });
    } catch (err) {
        console.error('Log error:', err.message);
        res.status(500).json({ error: 'Failed to save entry' });
    }
});

/**
 * GET /api/log?date=YYYY-MM-DD
 * Get food entries and totals for a date.
 */
app.get('/api/log', (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    try {
        const entries = loadEntries(date);
        const totals = computeTotals(entries);
        res.json({ date, entries, totals });
    } catch (err) {
        console.error('Load error:', err.message);
        res.status(500).json({ error: 'Failed to load entries' });
    }
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`CALTRC running at http://localhost:${PORT}`);
    });
}

module.exports = app;
