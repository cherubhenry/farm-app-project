// src/app/api/record-daily/route.ts
// POST endpoint to record daily production data

import { NextResponse } from "next/server";
import { recordDailySchema } from "@/lib/schema";
import { appendRow, checkDateExists } from "@/lib/sheets";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate payload
        const data = recordDailySchema.parse(body);

        const timestamp_iso = new Date().toISOString();
        const appended: { tab: string; rows: number }[] = [];

        // Append rooms (Room 1..6)
        if (data.rooms) {
            for (const [roomName, roomData] of Object.entries(data.rooms)) {
                const row = [
                    timestamp_iso,
                    data.date,
                    roomData.feeds_eaten ?? "",
                    roomData.water_litres ?? "",
                    roomData.medicine_given ?? "",
                    roomData.eggs_produced ?? "",
                    roomData.cracked_eggs ?? "",
                    roomData.mortality_count ?? "",
                    roomData.miscellaneous ?? "",
                ];
                await appendRow(roomName, row);
                appended.push({ tab: roomName, rows: 1 });
            }
        }

        // Append Egg Store
        if (data.eggStore) {
            const exists = await checkDateExists("Egg Store", data.date);
            if (exists) {
                return NextResponse.json(
                    { ok: false, error: `Doc for ${data.date} already exists for Egg Store` },
                    { status: 400 }
                );
            }
            const row = [
                timestamp_iso,
                data.date,
                data.eggStore.eggs_in_store_today ?? "",
                data.eggStore.were_eggs_purchased,
                data.eggStore.purchased_count ?? "",
                data.eggStore.miscellaneous ?? "",
            ];
            await appendRow("Egg Store", row);
            appended.push({ tab: "Egg Store", rows: 1 });
        }

        // Append Feed Store
        if (data.feedStore) {
            const exists = await checkDateExists("Feed Store", data.date);
            if (exists) {
                return NextResponse.json(
                    { ok: false, error: `Doc for ${data.date} already exists for Feed Store` },
                    { status: 400 }
                );
            }
            const row = [
                timestamp_iso,
                data.date,
                data.feedStore.feed_bags_in_store ?? "",
                data.feedStore.was_feed_brought_today,
                data.feedStore.bags_brought_today ?? "",
                data.feedStore.miscellaneous ?? "",
            ];
            await appendRow("Feed Store", row);
            appended.push({ tab: "Feed Store", rows: 1 });
        }

        // Append Sick Room
        if (data.sickRoom) {
            const exists = await checkDateExists("Sick Room", data.date);
            if (exists) {
                return NextResponse.json(
                    { ok: false, error: `Doc for ${data.date} already exists for Sick Room` },
                    { status: 400 }
                );
            }
            const row = [
                timestamp_iso,
                data.date,
                data.sickRoom.sick_birds_count ?? "",
                data.sickRoom.were_they_cared_for_today,
            ];
            await appendRow("Sick Room", row);
            appended.push({ tab: "Sick Room", rows: 1 });
        }


        return NextResponse.json({ ok: true, appended });
    } catch (error: any) {
        console.error("Error in /api/record-daily:", error);

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
