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
/**
 * Fetches summary data for a specific date from all room and store tabs.
 * Aggregates multiple entries for the same date.
 */
export async function getSummaryForDate(date: string) {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getGoogleSheetId();
        const tabs = ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6", "Egg Store", "Feed Store"];

        // Define ranges for each tab (A:I covers most, adjust if needed)
        const ranges = tabs.map(tab => `${tab}!A:I`);

        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        });

        const valueRanges = response.data.valueRanges;
        if (!valueRanges) return null;

        const summary: any = {
            date,
            rooms: {},
            eggStore: null,
            feedStore: null,
        };

        tabs.forEach((tab, index) => {
            const rows = valueRanges[index].values;
            if (!rows || rows.length < 2) return; // Need at least header + 1 row

            // Find all rows for date (Column B is index 1)
            const entries = rows.filter(r => r[1] === date);
            if (entries.length === 0) return;

            if (tab.startsWith("Room")) {
                // Initialize room data
                const roomData = {
                    feeds_eaten: 0,
                    eggs_produced: 0,
                    cracked_eggs: 0,
                    mortality_count: 0,
                };

                // Aggregate values
                entries.forEach(row => {
                    roomData.feeds_eaten += Number(row[2]) || 0;
                    roomData.eggs_produced += Number(row[5]) || 0;
                    roomData.cracked_eggs += Number(row[6]) || 0;
                    roomData.mortality_count += Number(row[7]) || 0;
                });

                summary.rooms[tab] = roomData;
            } else if (tab === "Egg Store") {
                // For store snapshots, we take the LAST entry of the day as the "Final" count
                const lastEntry = entries[entries.length - 1];
                summary.eggStore = {
                    eggs_in_store: Number(lastEntry[2]) || 0,
                };
            } else if (tab === "Feed Store") {
                // For store snapshots, we take the LAST entry of the day as the "Final" count
                const lastEntry = entries[entries.length - 1];
                summary.feedStore = {
                    feed_bags_in_store: Number(lastEntry[2]) || 0,
                };
            }
        });

        return summary;
    } catch (error) {
        console.error("Error fetching summary data:", error);
        throw error;
    }
}
