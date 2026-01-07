// src/components/RecordDailyForm.tsx
// Main Page Container
// Orchestrates the date state and renders sub-forms

"use client";

import { useState } from "react";
import SingleRoomForm from "./SingleRoomForm";
import StoreCareForm from "./StoreCareForm";

export default function RecordDailyForm() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    return (
        <div className="space-y-6">
            {/* Date Picker (Global) */}
            <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {/* Poultry Rooms */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Poultry Rooms</h2>
                {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"].map(roomName => (
                    <SingleRoomForm key={roomName} roomName={roomName} date={date} />
                ))}
            </div>

            {/* Store & Care */}
            <StoreCareForm date={date} />
        </div>
    );
}
