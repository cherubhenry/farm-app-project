// src/app/api/record-store/route.ts
// POST endpoint to record Store & Care data (Egg, Feed, Sick)
// Constraints:
// 1. One entry per day (checkDateExists)
// 2. Only submittable after 4 PM WAT (UTC+1) => >= 15:00 UTC

import { NextResponse } from "next/server";
import { recordStoreSchema } from "@/lib/schema";
import { appendRow, checkDateExists } from "@/lib/sheets";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Time Check (Server-side enforcement)
        const now = new Date();
        const utcHours = now.getUTCHours();
        // WAT is UTC+1. 16:00 WAT = 15:00 UTC.
        // We block if UTC time is BEFORE 15:00 (i.e., 00:00 - 14:59 UTC).
        if (utcHours < 15) {
            return NextResponse.json(
                { ok: false, error: "Store & Care sections can only be submitted after 4 PM WAT." },
                { status: 403 }
            );
        }

        // Validate payload
        const data = recordStoreSchema.parse(body);
        const timestamp_iso = new Date().toISOString();
        const appended: string[] = [];

        // 2. Duplicate Check + Append

        // Egg Store
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
                data.eggStore.cracked_eggs_purchased ?? "",
                data.eggStore.miscellaneous ?? "",
            ];
            await appendRow("Egg Store", row);
            appended.push("Egg Store");
        }

        // Feed Store
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
            appended.push("Feed Store");
        }

        // Sick Room
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
            appended.push("Sick Room");
        }

        return NextResponse.json({ ok: true, appended });
    } catch (error: any) {
        console.error("Error in /api/record-store:", error);

        if (error instanceof ZodError) {
            return NextResponse.json(
                { ok: false, error: "Validation failed", details: (error as any).errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { ok: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
