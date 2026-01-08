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

        // Fetch Previous Day Data for stock context
        const requestedDate = new Date(date);
        const prevDateObj = new Date(requestedDate);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        const prevDate = prevDateObj.toISOString().split('T')[0];
        const prevData = await getSummaryForDate(prevDate);

        if (!rawData) {
            return NextResponse.json({
                ok: true,
                summary: {
                    total_eggs_produced: 0,
                    feed_in_store_adjusted: 0,
                    rooms: {},
                    eggStore: null,
                    feedStore: null,
                    prevDayStock: {
                        eggs: prevData?.eggStore?.eggs_in_store || 0,
                        feed: prevData?.feedStore?.feed_bags_in_store || 0,
                    }
                }
            });
        }

        // Aggregate Data
        let total_eggs_produced = 0;
        let total_cracked_eggs = 0;
        let total_feeds_eaten = 0;
        let total_mortality = 0;

        const roomDetails: any = {};

        Object.entries(rawData.rooms).forEach(([roomName, data]: [string, any]) => {
            total_eggs_produced += data.eggs_produced;
            total_cracked_eggs += data.cracked_eggs;
            total_feeds_eaten += data.feeds_eaten;
            total_mortality += data.mortality_count;

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

        // Calculate Adjusted Feed based on Previous Day Stock
        // User Requirement: "Feed in store as stated ealier for any current day should show the value for the previous day, 
        // and as feed are given to the birds it should be subtracted from what we had the previous day"
        const prevFeedStock = prevData?.feedStore?.feed_bags_in_store || 0;
        const feed_in_store_adjusted = prevFeedStock - total_feeds_eaten;

        const summary = {
            date,
            total_eggs_produced,
            total_eggs_display: {
                crates: Math.floor(total_eggs_produced / 30),
                pieces: total_eggs_produced % 30
            },
            total_cracked_eggs,
            total_mortality,
            total_feeds_eaten,
            feed_in_store_adjusted,
            rooms: roomDetails,
            eggStore: rawData.eggStore,
            feedStore: rawData.feedStore, // Today's actual snapshot if needed
            prevDayStock: {
                eggs: prevData?.eggStore?.eggs_in_store || 0,
                feed: prevFeedStock
            }
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
