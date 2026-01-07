// src/lib/sheets.ts
// Server-only: Google Sheets API client

import { google } from "googleapis";
import { getGoogleServiceAccount, getGoogleSheetId } from "./env";

// Create authenticated Sheets client
export function getSheetsClient() {
    const credentials = getGoogleServiceAccount();
    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
}

// Append a row to a specific tab
export async function appendRow(tabName: string, rowValues: any[]) {
    const sheets = getSheetsClient();
    const spreadsheetId = getGoogleSheetId();

    const range = `${tabName}!A1`; // Start at A1, auto-expands to append

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED", // Interprets values (dates, numbers, formulas)
        requestBody: {
            values: [rowValues], // 2D array: [[row1], [row2], ...]
        },
    });

    return response.data;
}

/**
 * Checks if a specific date already exists in the given tab's Date column (Column B).
 * Assumes 'Date' is in Column B (index 1).
 */
export async function checkDateExists(tabName: string, dateToCheck: string): Promise<boolean> {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getGoogleSheetId();

        // Get Column B (Date column)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${tabName}!B:B`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return false;

        // Check if date exists in the column
        // Flatten the array of arrays (rows) to a single array of strings
        const dates = rows.flat();
        return dates.includes(dateToCheck);
    } catch (error) {
        console.error(`Error checking date in ${tabName}:`, error);
        throw error;
    }
}
