// src/components/StoreCareForm.tsx
import { useState, useEffect } from "react";
import RoomAccordion from "./RoomAccordion";

interface StoreCareFormProps {
    date: string;
}

export default function StoreCareForm({ date }: StoreCareFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [canSubmit, setCanSubmit] = useState(false);

    // State
    const [eggStore, setEggStore] = useState<any>({});
    const [feedStore, setFeedStore] = useState<any>({});
    const [sickRoom, setSickRoom] = useState<any>({});

    // Time Check Logic (Client Side)
    useEffect(() => {
        const checkTime = () => {
            // WAT is Africa/Lagos
            const now = new Date();
            const watTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
            const hours = watTime.getHours();
            // Allow if >= 16 (4 PM)
            setCanSubmit(hours >= 16);
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) {
            setMessage({ type: 'error', text: '❌ Submissions only allowed after 4 PM WAT' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            // Process egg store
            let processedEggStore = undefined;
            const hasEggData = Object.values(eggStore).some(v => v !== undefined && v !== '');

            if (hasEggData) {
                // Combine Crates/Pieces
                const inStoreCrates = Number(eggStore.in_store_crates || 0);
                const inStorePieces = Number(eggStore.in_store_pieces || 0);

                const purchasedCrates = Number(eggStore.purchased_crates || 0);
                const purchasedPieces = Number(eggStore.purchased_pieces || 0);

                const crackedCrates = Number(eggStore.cracked_crates || 0);
                const crackedPieces = Number(eggStore.cracked_pieces || 0);

                processedEggStore = {
                    eggs_in_store_today: (inStoreCrates * 30) + inStorePieces,
                    were_eggs_purchased: eggStore.were_eggs_purchased === 'true',
                    purchased_count: eggStore.were_eggs_purchased === 'true' ? (purchasedCrates * 30) + purchasedPieces : undefined,
                    cracked_eggs_purchased: eggStore.were_eggs_purchased === 'true' ? (crackedCrates * 30) + crackedPieces : undefined,
                    miscellaneous: eggStore.miscellaneous || undefined,
                };
            }

            // Process feed store
            let processedFeedStore = undefined;
            if (Object.values(feedStore).some(v => v !== undefined && v !== '')) {
                processedFeedStore = {
                    feed_bags_in_store: feedStore.feed_bags_in_store ? Number(feedStore.feed_bags_in_store) : undefined,
                    was_feed_brought_today: feedStore.was_feed_brought_today === 'true',
                    bags_brought_today: feedStore.bags_brought_today ? Number(feedStore.bags_brought_today) : undefined,
                    miscellaneous: feedStore.miscellaneous || undefined,
                };
            }

            // Process sick room
            let processedSickRoom = undefined;
            if (Object.values(sickRoom).some(v => v !== undefined && v !== '')) {
                processedSickRoom = {
                    sick_birds_count: sickRoom.sick_birds_count ? Number(sickRoom.sick_birds_count) : undefined,
                    were_they_cared_for_today: sickRoom.were_they_cared_for_today === 'true',
                };
            }

            if (!processedEggStore && !processedFeedStore && !processedSickRoom) {
                setMessage({ type: 'error', text: '❌ Please fill at least one section' });
                setIsSubmitting(false);
                return;
            }

            const payload = {
                date,
                eggStore: processedEggStore,
                feedStore: processedFeedStore,
                sickRoom: processedSickRoom,
            };

            const response = await fetch('/api/record-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.ok) {
                setMessage({ type: 'success', text: '✅ Daily Summary saved successfully!' });
                setEggStore({});
                setFeedStore({});
                setSickRoom({});
            } else {
                setMessage({ type: 'error', text: `❌ Error: ${result.error}` });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6 mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Evening Checkout (Store & Care)</h2>
                {!canSubmit && (
                    <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
                        Opens at 4 PM WAT
                    </span>
                )}
            </div>

            {/* Egg Store */}
            <RoomAccordion title="Egg Store">
                <div className="space-y-6">
                    {/* Eggs in Store */}
                    <div className="border-b pb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Total Eggs in Store Today</label>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Crates (30)</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Crates"
                                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-black font-bold"
                                    value={eggStore.in_store_crates || ''}
                                    onChange={(e) => setEggStore({ ...eggStore, in_store_crates: e.target.value })}
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Egg Pieces</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Pieces"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    value={eggStore.in_store_pieces || ''}
                                    onChange={(e) => setEggStore({ ...eggStore, in_store_pieces: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Were eggs purchased today?</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="were_eggs_purchased"
                                    value="true"
                                    checked={eggStore.were_eggs_purchased === 'true'}
                                    onChange={(e) => setEggStore({ ...eggStore, were_eggs_purchased: e.target.value })}
                                    className="mr-2"
                                />
                                Yes
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="were_eggs_purchased"
                                    value="false"
                                    checked={eggStore.were_eggs_purchased === 'false'}
                                    onChange={(e) => setEggStore({ ...eggStore, were_eggs_purchased: e.target.value })}
                                    className="mr-2"
                                />
                                No
                            </label>
                        </div>
                    </div>

                    {eggStore.were_eggs_purchased === 'true' && (
                        <div className="bg-orange-50/50 p-4 rounded-lg space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-orange-900 mb-2">How many eggs purchased?</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <span className="text-[10px] text-orange-700 uppercase font-bold">Crates (30)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border-2 border-orange-400 rounded-md focus:ring-2 focus:ring-orange-500 bg-white text-black font-bold"
                                            value={eggStore.purchased_crates || ''}
                                            onChange={(e) => setEggStore({ ...eggStore, purchased_crates: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[10px] text-orange-700 uppercase font-bold">Egg Pieces</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-orange-500"
                                            value={eggStore.purchased_pieces || ''}
                                            onChange={(e) => setEggStore({ ...eggStore, purchased_pieces: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-red-900 mb-2">How many cracked eggs purchased?</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <span className="text-[10px] text-red-700 uppercase font-bold">Crates</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 bg-white text-black font-bold"
                                            value={eggStore.cracked_crates || ''}
                                            onChange={(e) => setEggStore({ ...eggStore, cracked_crates: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[10px] text-red-700 uppercase font-bold">Pieces</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border border-red-200 rounded-md focus:ring-2 focus:ring-red-500"
                                            value={eggStore.cracked_pieces || ''}
                                            onChange={(e) => setEggStore({ ...eggStore, cracked_pieces: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Notes</label>
                        <textarea
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={eggStore.miscellaneous || ''}
                            onChange={(e) => setEggStore({ ...eggStore, miscellaneous: e.target.value })}
                        />
                    </div>
                </div>
            </RoomAccordion>

            {/* Feed Store */}
            <RoomAccordion title="Feed Store">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feed Bags in Store</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black font-bold"
                            value={feedStore.feed_bags_in_store || ''}
                            onChange={(e) => setFeedStore({ ...feedStore, feed_bags_in_store: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Was feed brought today?</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="was_feed_brought_today"
                                    value="true"
                                    checked={feedStore.was_feed_brought_today === 'true'}
                                    onChange={(e) => setFeedStore({ ...feedStore, was_feed_brought_today: e.target.value })}
                                    className="mr-2"
                                />
                                Yes
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="was_feed_brought_today"
                                    value="false"
                                    checked={feedStore.was_feed_brought_today === 'false'}
                                    onChange={(e) => setFeedStore({ ...feedStore, was_feed_brought_today: e.target.value })}
                                    className="mr-2"
                                />
                                No
                            </label>
                        </div>
                    </div>
                    {feedStore.was_feed_brought_today === 'true' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">How many bags?</label>
                            <input
                                type="number"
                                min="0"
                                required
                                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black font-bold"
                                value={feedStore.bags_brought_today || ''}
                                onChange={(e) => setFeedStore({ ...feedStore, bags_brought_today: e.target.value })}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Notes</label>
                        <textarea
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={feedStore.miscellaneous || ''}
                            onChange={(e) => setFeedStore({ ...feedStore, miscellaneous: e.target.value })}
                        />
                    </div>
                </div>
            </RoomAccordion>

            {/* Sick Room */}
            <RoomAccordion title="Sick Room">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sick Birds Count</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black font-bold"
                            value={sickRoom.sick_birds_count || ''}
                            onChange={(e) => setSickRoom({ ...sickRoom, sick_birds_count: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Were they cared for today?</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="were_they_cared_for_today"
                                    value="true"
                                    checked={sickRoom.were_they_cared_for_today === 'true'}
                                    onChange={(e) => setSickRoom({ ...sickRoom, were_they_cared_for_today: e.target.value })}
                                    className="mr-2"
                                />
                                Yes
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="were_they_cared_for_today"
                                    value="false"
                                    checked={sickRoom.were_they_cared_for_today === 'false'}
                                    onChange={(e) => setSickRoom({ ...sickRoom, were_they_cared_for_today: e.target.value })}
                                    className="mr-2"
                                />
                                No
                            </label>
                        </div>
                    </div>
                </div>
            </RoomAccordion>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors text-lg"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Daily Summary'}
            </button>
        </form>
    );
}
