// src/components/InitRoomsForm.tsx
// Form for initializing farm rooms

"use client";

import { useState } from "react";
import RoomAccordion from "./RoomAccordion";

export default function InitRoomsForm() {
    const [passcode, setPasscode] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [rooms, setRooms] = useState<Record<string, any>>({
        "Room 1": {},
        "Room 2": {},
        "Room 3": {},
        "Room 4": {},
        "Room 5": {},
        "Room 6": {},
    });

    // Auto-unlock if passcode matches (Client-side convenience, server still validates)
    if (!isUnlocked && passcode === "OKbusinessfarm1597") {
        setIsUnlocked(true);
    }
    // Re-lock if passcode is cleared? No, typically once unlocked it stays unless refreshed.
    // But if they type wrong code after unlocking, maybe re-lock?
    // Let's keep it simple: matches -> unlock.

    const handleRoomChange = (roomName: string, field: string, value: any) => {
        setRooms(prev => ({
            ...prev,
            [roomName]: { ...prev[roomName], [field]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Filter out empty rooms
            const filledRooms: Record<string, any> = {};
            Object.entries(rooms).forEach(([roomName, roomData]) => {
                const hasData = Object.values(roomData).some(v => v !== undefined && v !== '');
                if (hasData) {
                    const processedData: any = {};
                    Object.entries(roomData).forEach(([key, value]) => {
                        if (value === '' || value === undefined) return;
                        if (['birds_count', 'feeders_count', 'drinkers_count'].includes(key)) {
                            processedData[key] = Number(value);
                        } else {
                            processedData[key] = value;
                        }
                    });
                    filledRooms[roomName] = processedData;
                }
            });

            const payload = {
                date,
                passcode,
                rooms: Object.keys(filledRooms).length > 0 ? filledRooms : undefined,
            };

            const response = await fetch('/api/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.ok) {
                setMessage({ type: 'success', text: '✅ Initialization saved successfully!' });
                // Clear form
                setRooms({
                    "Room 1": {}, "Room 2": {}, "Room 3": {}, "Room 4": {}, "Room 5": {}, "Room 6": {},
                });
                setPasscode("");
                setIsUnlocked(false); // Re-lock after successful save
            } else {
                setMessage({ type: 'error', text: `❌ Error: ${result.error || 'Failed to save initialization'}` });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderRoomFields = (roomName: string) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Birds</label>
                <input
                    type="number"
                    min="0"
                    disabled={!isUnlocked}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 bg-white text-black font-bold"
                    value={rooms[roomName]?.birds_count || ''}
                    onChange={(e) => handleRoomChange(roomName, 'birds_count', e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Feeders</label>
                <input
                    type="number"
                    min="0"
                    disabled={!isUnlocked}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    value={rooms[roomName]?.feeders_count || ''}
                    onChange={(e) => handleRoomChange(roomName, 'feeders_count', e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Drinkers</label>
                <input
                    type="number"
                    min="0"
                    disabled={!isUnlocked}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    value={rooms[roomName]?.drinkers_count || ''}
                    onChange={(e) => handleRoomChange(roomName, 'drinkers_count', e.target.value)}
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Notes</label>
                <textarea
                    rows={2}
                    disabled={!isUnlocked}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 bg-white text-black font-bold"
                    value={rooms[roomName]?.miscellaneous || ''}
                    onChange={(e) => handleRoomChange(roomName, 'miscellaneous', e.target.value)}
                />
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Passcode */}
            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                        type="date"
                        required
                        disabled={!isUnlocked}
                        className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 bg-white text-black font-bold"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Security Passcode {isUnlocked ? '🔓' : '🔒'}
                    </label>
                    <input
                        type="password"
                        required
                        placeholder="Enter code to unlock editing"
                        className={`w-full px-3 py-2 border-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black font-bold ${isUnlocked ? 'border-green-500 ring-green-500' : 'border-gray-400'}`}
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                    />
                    {!isUnlocked && passcode.length > 5 && (
                        <p className="text-xs text-red-500 mt-1">Incorrect code</p>
                    )}
                </div>
            </div>

            {/* Rooms */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Initialize Rooms</h2>
                {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"].map(roomName => (
                    <RoomAccordion key={roomName} title={roomName}>
                        {renderRoomFields(roomName)}
                    </RoomAccordion>
                ))}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || !isUnlocked}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
                {isSubmitting ? 'Saving...' : 'Save Initialization'}
            </button>
        </form>
    );
}
