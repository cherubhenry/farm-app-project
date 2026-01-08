// src/components/SingleRoomForm.tsx
import { useState } from "react";
import RoomAccordion from "./RoomAccordion";

interface SingleRoomFormProps {
    roomName: string;
    date: string;
}

export default function SingleRoomForm({ roomName, date }: SingleRoomFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState<any>({});

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Process data: strings to numbers where needed
            const processedData: any = {};

            // Handle regular fields
            ['feeds_eaten', 'water_litres', 'mortality_count'].forEach(key => {
                if (formData[key] !== undefined && formData[key] !== '') {
                    processedData[key] = Number(formData[key]);
                }
            });

            if (formData.medicine_given) processedData.medicine_given = formData.medicine_given;
            if (formData.miscellaneous) processedData.miscellaneous = formData.miscellaneous;

            // Handle Egg Production (Crates + Pieces)
            const prodCrates = Number(formData.eggs_produced_crates || 0);
            const prodPieces = Number(formData.eggs_produced_pieces || 0);
            if (formData.eggs_produced_crates || formData.eggs_produced_pieces) {
                processedData.eggs_produced = (prodCrates * 30) + prodPieces;
            }

            // Handle Cracked Eggs (Crates + Pieces)
            const crackedCrates = Number(formData.cracked_eggs_crates || 0);
            const crackedPieces = Number(formData.cracked_eggs_pieces || 0);
            if (formData.cracked_eggs_crates || formData.cracked_eggs_pieces) {
                processedData.cracked_eggs = (crackedCrates * 30) + crackedPieces;
            }

            if (Object.keys(processedData).length === 0) {
                setMessage({ type: 'error', text: '❌ No data provided' });
                setIsSubmitting(false);
                return;
            }

            const payload = {
                date,
                roomName,
                data: processedData,
            };

            const response = await fetch('/api/record-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.ok) {
                setMessage({ type: 'success', text: `✅ Saved ${roomName}` });
                setFormData({}); // Clear form
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
        <RoomAccordion title={roomName}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feeds Eaten (bags)</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.feeds_eaten || ''}
                            onChange={(e) => handleChange('feeds_eaten', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Water (litres)</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.water_litres || ''}
                            onChange={(e) => handleChange('water_litres', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Given</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.medicine_given || ''}
                            onChange={(e) => handleChange('medicine_given', e.target.value)}
                        />
                    </div>

                    {/* Eggs Produced */}
                    <div className="border border-gray-100 p-2 rounded-lg bg-blue-50/30">
                        <label className="block text-sm font-bold text-blue-900 mb-1">Eggs Produced</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Crates (30)</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Crates"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    value={formData.eggs_produced_crates || ''}
                                    onChange={(e) => handleChange('eggs_produced_crates', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Egg Pieces</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Pieces"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    value={formData.eggs_produced_pieces || ''}
                                    onChange={(e) => handleChange('eggs_produced_pieces', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cracked Eggs */}
                    <div className="border border-gray-100 p-2 rounded-lg bg-red-50/30">
                        <label className="block text-sm font-bold text-red-900 mb-1">Cracked Eggs</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Crates (30)</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Crates"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                                    value={formData.cracked_eggs_crates || ''}
                                    onChange={(e) => handleChange('cracked_eggs_crates', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Egg Pieces</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Pieces"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                                    value={formData.cracked_eggs_pieces || ''}
                                    onChange={(e) => handleChange('cracked_eggs_pieces', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mortality Count</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.mortality_count || ''}
                            onChange={(e) => handleChange('mortality_count', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Notes</label>
                        <textarea
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.miscellaneous || ''}
                            onChange={(e) => handleChange('miscellaneous', e.target.value)}
                        />
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    {isSubmitting ? 'Saving...' : `Save ${roomName} Record`}
                </button>
            </form>
        </RoomAccordion>
    );
}
