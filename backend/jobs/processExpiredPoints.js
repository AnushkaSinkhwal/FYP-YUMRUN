/**
 * Cron job to process expired loyalty points
 * This script should be run daily to check for and process expired loyalty points
 * 
 * It can be set up with a cron job like:
 * 0 0 * * * node /path/to/backend/jobs/processExpiredPoints.js
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const { processExpiredPoints } = require('../utils/loyaltyUtils');
const User = require('../models/user');
const LoyaltyTransaction = require('../models/loyaltyTransaction');

async function main() {
    try {
        console.log('Connecting to database...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to database. Processing expired points...');
        
        // Process expired points
        const processed = await processExpiredPoints(LoyaltyTransaction, User);
        
        console.log(`Successfully processed ${processed} expired point transactions`);
        
        // Disconnect from the database
        await mongoose.disconnect();
        console.log('Disconnected from database');
        
        process.exit(0);
    } catch (error) {
        console.error('Error processing expired points:', error);
        
        // Try to disconnect if there was an error
        try {
            await mongoose.disconnect();
            console.log('Disconnected from database after error');
        } catch (disconnectError) {
            console.error('Error disconnecting from database:', disconnectError);
        }
        
        process.exit(1);
    }
}

// Run the main function
main(); 