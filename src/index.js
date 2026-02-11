/**
 * CALTRC — Calorie Tracking Application
 *
 * Entry point. Exports all modules for use by API layer or CLI.
 */

const DataStore = require('./dataStore');
const surveyModule = require('./surveyModule');
const foodLogger = require('./foodLogger');
const goalEngine = require('./goalEngine');

// Shared data store instance
const store = new DataStore();

module.exports = {
    DataStore,
    surveyModule,
    foodLogger,
    goalEngine,
    store,
};

// If run directly, print a welcome message
if (require.main === module) {
    console.log('🥗 CALTRC — Calorie Tracking Application');
    console.log('   Modules loaded: Survey, Food Logger, Goal Engine');
    console.log('   Run "npm test" to execute tests.');
}
