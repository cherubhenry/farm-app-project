// setup-sheet.js
// Script to create all required tabs and headers in the Google Sheet

const { google } = require('googleapis');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

function getGoogleServiceAccount() {
    const base64 = process.env.GOOGLE_SA_JSON_BASE64;
    if (!base64) {
        throw new Error("GOOGLE_SA_JSON_BASE64 environment variable is not set");
    }
    const jsonString = Buffer.from(base64, "base64").toString("utf-8");
    const credentials = JSON.parse(jsonString);
    if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }
    return credentials;
}

function getGoogleSheetId() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
        throw new Error("GOOGLE_SHEET_ID environment variable is not set");
    }
    return sheetId;
}

async function setupSheet() {
    const credentials = getGoogleServiceAccount();
    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = getGoogleSheetId();

    console.log('🚀 Setting up Google Sheet tabs and headers...\n');

    // Define all tabs with their headers
    const tabConfigs = [
        // Daily Production Tabs
        {
            name: 'Room 1',
            headers: ['timestamp_iso', 'date', 'feeds_eaten', 'water_litres', 'medicine_given', 'eggs_produced', 'cracked_eggs', 'mortality_count', 'miscellaneous']
        },
        {
            name: 'Room 2',
            headers: ['timestamp_iso', 'date', 'feeds_eaten', 'water_litres', 'medicine_given', 'eggs_produced', 'cracked_eggs', 'mortality_count', 'miscellaneous']
        },
        {
            name: 'Room 3',
            headers: ['timestamp_iso', 'date', 'feeds_eaten', 'water_litres', 'medicine_given', 'eggs_produced', 'cracked_eggs', 'mortality_count', 'miscellaneous']
        },
        {
            name: 'Room 4',
            headers: ['timestamp_iso', 'date', 'feeds_eaten', 'water_litres', 'medicine_given', 'eggs_produced', 'cracked_eggs', 'mortality_count', 'miscellaneous']
        },
        {
            name: 'Room 5',
            headers: ['timestamp_iso', 'date', 'feeds_eaten', 'water_litres', 'medicine_given', 'eggs_produced', 'cracked_eggs', 'mortality_count', 'miscellaneous']
        },
        {
            name: 'Room 6',
            headers: ['timestamp_iso', 'date', 'feeds_eaten', 'water_litres', 'medicine_given', 'eggs_produced', 'cracked_eggs', 'mortality_count', 'miscellaneous']
        },
        {
            name: 'Egg Store',
            headers: ['timestamp_iso', 'date', 'eggs_in_store_today', 'were_eggs_purchased', 'purchased_count', 'miscellaneous']
        },
        {
            name: 'Feed Store',
            headers: ['timestamp_iso', 'date', 'feed_bags_in_store', 'was_feed_brought_today', 'bags_brought_today', 'miscellaneous']
        },
        {
            name: 'Sick Room',
            headers: ['timestamp_iso', 'date', 'sick_birds_count', 'were_they_cared_for_today']
        },
        // Initialization Tabs
        {
            name: 'Init - Room 1',
            headers: ['timestamp_iso', 'date', 'birds_count', 'feeders_count', 'drinkers_count', 'miscellaneous']
        },
        {
            name: 'Init - Room 2',
            headers: ['timestamp_iso', 'date', 'birds_count', 'feeders_count', 'drinkers_count', 'miscellaneous']
        },
        {
            name: 'Init - Room 3',
            headers: ['timestamp_iso', 'date', 'birds_count', 'feeders_count', 'drinkers_count', 'miscellaneous']
        },
        {
            name: 'Init - Room 4',
            headers: ['timestamp_iso', 'date', 'birds_count', 'feeders_count', 'drinkers_count', 'miscellaneous']
        },
        {
            name: 'Init - Room 5',
            headers: ['timestamp_iso', 'date', 'birds_count', 'feeders_count', 'drinkers_count', 'miscellaneous']
        },
        {
            name: 'Init - Room 6',
            headers: ['timestamp_iso', 'date', 'birds_count', 'feeders_count', 'drinkers_count', 'miscellaneous']
        },
    ];

    // Get existing spreadsheet to check current tabs
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

    console.log('📋 Existing tabs:', existingSheets.join(', ') || 'None');
    console.log('');

    // Prepare batch update requests
    const requests = [];

    for (const config of tabConfigs) {
        if (!existingSheets.includes(config.name)) {
            // Create new sheet
            requests.push({
                addSheet: {
                    properties: {
                        title: config.name,
                    }
                }
            });
            console.log(`✨ Will create tab: ${config.name}`);
        } else {
            console.log(`✓ Tab already exists: ${config.name}`);
        }
    }

    // Execute batch update to create sheets
    if (requests.length > 0) {
        console.log(`\n🔨 Creating ${requests.length} new tabs...`);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests }
        });
        console.log('✅ Tabs created successfully!\n');
    } else {
        console.log('\n✅ All tabs already exist!\n');
    }

    // Now add headers to each tab
    console.log('📝 Adding headers to tabs...\n');
    for (const config of tabConfigs) {
        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${config.name}!A1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [config.headers]
                }
            });
            console.log(`✓ Headers added to: ${config.name}`);
        } catch (error) {
            console.error(`❌ Error adding headers to ${config.name}:`, error.message);
        }
    }

    console.log('\n🎉 Google Sheet setup complete!');
    console.log(`\n📊 View your sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}

setupSheet().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
});
