// src/app/api/initialize/route.ts
// POST endpoint to initialize farm rooms

import { NextResponse } from "next/server";
import { initializeSchema } from "@/lib/schema";
import { appendRow } from "@/lib/sheets";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate payload
        const data = initializeSchema.parse(body);

        // Validate Passcode
        if (data.passcode !== "OKbusinessfarm1597") {
            return NextResponse.json(
                { ok: false, error: "Invalid passcode" },
                { status: 403 }
            );
        }

        const timestamp_iso = new Date().toISOString();
        const appended: { tab: string; rows: number }[] = [];

        // Append initialization data
        if (data.rooms) {
            for (const [roomName, roomData] of Object.entries(data.rooms)) {
                const tabName = `Init - ${roomName}`;
                const row = [
                    timestamp_iso,
                    data.date,
                    roomData.birds_count ?? "",
                    roomData.feeders_count ?? "",
                    roomData.drinkers_count ?? "",
                    roomData.miscellaneous ?? "",
                ];
                await appendRow(tabName, row);
                appended.push({ tab: tabName, rows: 1 });
            }
        }

        return NextResponse.json({ ok: true, appended });
    } catch (error: any) {
        console.error("Error in /api/initialize:", error);

        // Handle Zod validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Validation failed",
                    details: error.errors,
                },
                { status: 400 }
            );
        }

        // Handle other errors
        return NextResponse.json(
            {
                ok: false,
                error: error.message || "Internal server error",
            },
            { status: 500 }
        );
    }
}
