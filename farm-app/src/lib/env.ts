// src/lib/env.ts
// Server-only: Parse and decode environment variables
// DO NOT import this file in client components

export function getGoogleServiceAccount() {
  const base64 = process.env.GOOGLE_SA_JSON_BASE64;
  if (!base64) {
    throw new Error("GOOGLE_SA_JSON_BASE64 environment variable is not set");
  }

  // Decode Base64 to JSON string
  const jsonString = Buffer.from(base64, "base64").toString("utf-8");

  // Parse JSON
  const credentials = JSON.parse(jsonString);

  // Normalize private_key (replace literal \n with actual newlines)
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return credentials;
}

export function getGoogleSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }
  return sheetId;
}
