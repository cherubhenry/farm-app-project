// src/lib/schema.ts
// Shared validation schemas for API payloads

import { z } from "zod";

// Shared schemas
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const nonNegativeInt = z.number().int().min(0);
const optionalNonNegativeInt = nonNegativeInt.optional();

// Daily room data
const roomDailySchema = z.object({
    feeds_eaten: optionalNonNegativeInt,
    water_litres: optionalNonNegativeInt,
    medicine_given: z.string().optional(),
    eggs_produced: optionalNonNegativeInt,
    cracked_eggs: optionalNonNegativeInt,
    mortality_count: optionalNonNegativeInt,
    miscellaneous: z.string().optional(),
});

// Egg Store
const eggStoreSchema = z
    .object({
        eggs_in_store_today: optionalNonNegativeInt,
        were_eggs_purchased: z.boolean(),
        purchased_count: optionalNonNegativeInt,
        cracked_eggs_purchased: optionalNonNegativeInt,
        miscellaneous: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.were_eggs_purchased && !data.purchased_count) {
                return false; // purchased_count required when were_eggs_purchased is true
            }
            return true;
        },
        {
            message: "purchased_count is required when were_eggs_purchased is true",
            path: ["purchased_count"],
        }
    );

// Feed Store
const feedStoreSchema = z
    .object({
        feed_bags_in_store: optionalNonNegativeInt,
        was_feed_brought_today: z.boolean(),
        bags_brought_today: optionalNonNegativeInt,
        miscellaneous: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.was_feed_brought_today && !data.bags_brought_today) {
                return false; // bags_brought_today required when was_feed_brought_today is true
            }
            return true;
        },
        {
            message: "bags_brought_today is required when was_feed_brought_today is true",
            path: ["bags_brought_today"],
        }
    );

// Sick Room
const sickRoomSchema = z.object({
    sick_birds_count: optionalNonNegativeInt,
    were_they_cared_for_today: z.boolean(),
});

// POST /api/record-room payload
export const recordRoomSchema = z.object({
    date: dateSchema,
    roomName: z.enum(["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"]),
    data: roomDailySchema,
});

// POST /api/record-store payload
export const recordStoreSchema = z.object({
    date: dateSchema,
    eggStore: eggStoreSchema.optional(),
    feedStore: feedStoreSchema.optional(),
    sickRoom: sickRoomSchema.optional(),
});

// Initialization room data
const roomInitSchema = z.object({
    birds_count: optionalNonNegativeInt,
    feeders_count: optionalNonNegativeInt,
    drinkers_count: optionalNonNegativeInt,
    miscellaneous: z.string().optional(),
});

// POST /api/initialize payload
export const initializeSchema = z.object({
    date: dateSchema,
    passcode: z.string().min(1, "Passcode is required"),
    rooms: z.object({
        "Room 1": roomInitSchema.optional(),
        "Room 2": roomInitSchema.optional(),
        "Room 3": roomInitSchema.optional(),
        "Room 4": roomInitSchema.optional(),
        "Room 5": roomInitSchema.optional(),
        "Room 6": roomInitSchema.optional(),
    }).optional(),
});

// TypeScript types (inferred from schemas)
export type RecordRoomPayload = z.infer<typeof recordRoomSchema>;
export type RecordStorePayload = z.infer<typeof recordStoreSchema>;
export type InitializePayload = z.infer<typeof initializeSchema>;
