const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

function getGoogleServiceAccount() {
    const base64 = process.env.GOOGLE_SA_JSON_BASE64;
    if (!base64) throw new Error("GOOGLE_SA_JSON_BASE64 environment variable is not set");
    const jsonString = Buffer.from(base64, "base64").toString("utf-8");
    const credentials = JSON.parse(jsonString);
    if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    return credentials;
}

async function updateEggStoreHeaders() {
    const credentials = getGoogleServiceAccount();
    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const newHeaders = ['timestamp_iso', 'date', 'eggs_in_store_today', 'were_eggs_purchased', 'purchased_count', 'cracked_eggs_purchased', 'miscellaneous'];

    console.log('📝 Updating Egg Store headers...');
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Egg Store!A1',
        valueInputOption: 'RAW',
        requestBody: {
            values: [newHeaders]
        }
    });
    console.log('✅ Headers updated successfully!');
}

updateEggStoreHeaders().catch(console.error);
