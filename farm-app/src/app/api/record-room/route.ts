// src/app/api/record-room/route.ts
// POST endpoint to record single room data (allows multiple entries/day)

import { NextResponse } from "next/server";
import { recordRoomSchema } from "@/lib/schema";
import { appendRow } from "@/lib/sheets";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate payload
        const data = recordRoomSchema.parse(body);
        const timestamp_iso = new Date().toISOString();

        const row = [
            timestamp_iso,
            data.date,
            data.data.feeds_eaten ?? "",
            data.data.water_litres ?? "",
            data.data.medicine_given ?? "",
            data.data.eggs_produced ?? "",
            data.data.cracked_eggs ?? "",
            data.data.mortality_count ?? "",
            data.data.miscellaneous ?? "",
        ];

        await appendRow(data.roomName, row);

        return NextResponse.json({ ok: true, message: `Saved ${data.roomName}` });
    } catch (error: any) {
        console.error("Error in /api/record-room:", error);

        if (error instanceof ZodError) {
            return NextResponse.json(
                { ok: false, error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { ok: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
