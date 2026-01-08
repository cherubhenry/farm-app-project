// src/app/api/summary/route.ts
import { NextResponse } from "next/server";
import { getSummaryForDate } from "@/lib/sheets";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date) {
            return NextResponse.json(
                { ok: false, error: "Date is required" },
                { status: 400 }
            );
        }

        const rawData = await getSummaryForDate(date);

        if (!rawData) {
            return NextResponse.json({
                ok: true,
                summary: {
                    total_eggs_produced: 0,
                    feed_in_store_adjusted: 0,
                    rooms: {},
                    eggStore: null,
                    feedStore: null,
                }
            });
        }

        // Aggregate Data
        let total_eggs_produced = 0;
        let total_cracked_eggs = 0;
        let total_feeds_eaten = 0;

        const roomDetails: any = {};

        Object.entries(rawData.rooms).forEach(([roomName, data]: [string, any]) => {
            total_eggs_produced += data.eggs_produced;
            total_cracked_eggs += data.cracked_eggs;
            total_feeds_eaten += data.feeds_eaten;

            // Convert pieces to Crates & Pieces for display
            roomDetails[roomName] = {
                ...data,
                eggs_produced_display: {
                    crates: Math.floor(data.eggs_produced / 30),
                    pieces: data.eggs_produced % 30
                },
                cracked_eggs_display: {
                    crates: Math.floor(data.cracked_eggs / 30),
                    pieces: data.cracked_eggs % 30
                }
            };
        });

        // Calculate Adjusted Feed
        // feed_in_store_adjusted = raw_feed_store - (sum of feeds eaten in rooms)
        const rawFeedStock = rawData.feedStore?.feed_bags_in_store || 0;
        const feed_in_store_adjusted = rawFeedStock - total_feeds_eaten;

        const summary = {
            date,
            total_eggs_produced,
            total_eggs_display: {
                crates: Math.floor(total_eggs_produced / 30),
                pieces: total_eggs_produced % 30
            },
            total_cracked_eggs,
            total_feeds_eaten,
            feed_in_store_adjusted,
            rooms: roomDetails,
            eggStore: rawData.eggStore,
            feedStore: rawData.feedStore, // raw value if needed
        };

        return NextResponse.json({ ok: true, summary });
    } catch (error: any) {
        console.error("Summary API Error:", error);
        return NextResponse.json(
            { ok: false, error: "Failed to fetch summary" },
            { status: 500 }
        );
    }
}
