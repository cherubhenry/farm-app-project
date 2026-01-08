// src/app/summary/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SummaryPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = async (targetDate: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/summary?date=${targetDate}`);
            const result = await res.json();
            if (result.ok) {
                setData(result.summary);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Failed to load summary");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary(date);
    }, [date]);

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Farm Insights Dashboard</h1>
                        <p className="text-gray-500 mt-1">Real-time production and stock overview</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <input
                            type="date"
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <Link
                            href="/"
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-blue-100"
                        >
                            Back to Recording
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 text-center">
                        <p className="font-bold text-lg">Error loading data</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                                <p className="text-blue-100 font-bold uppercase tracking-wider text-xs">Total Production</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-4xl font-black">{data?.total_eggs_display?.crates || 0}</span>
                                    <span className="text-blue-100 font-medium">Crates</span>
                                    <span className="text-2xl font-black ml-2">{data?.total_eggs_display?.pieces || 0}</span>
                                    <span className="text-blue-100 font-medium whitespace-nowrap">Pieces</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-blue-500/30">
                                    <p className="text-xs text-blue-100 opacity-80">
                                        Aggregated from all 6 rooms
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Eggs in Store</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-900">
                                        {Math.floor((data?.eggStore?.eggs_in_store || 0) / 30)}
                                    </span>
                                    <span className="text-gray-500 font-medium">Crates</span>
                                    <span className="text-2xl font-black text-gray-900 ml-2">
                                        {(data?.eggStore?.eggs_in_store || 0) % 30}
                                    </span>
                                    <span className="text-gray-500 font-medium">Pieces</span>
                                </div>
                                <p className="mt-4 text-xs text-gray-400">Recorded during evening checkout</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Feed Balanced Stock</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className={`text-4xl font-black ${data?.feed_in_store_adjusted < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                        {data?.feed_in_store_adjusted || 0}
                                    </span>
                                    <span className="text-gray-500 font-medium">Bags</span>
                                </div>
                                <p className="mt-4 text-xs text-gray-400">Store total - usage in all rooms</p>
                            </div>
                        </div>

                        {/* Room Details Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-lg">Room-by-Room Breakdown</h3>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">Today's Data</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Room</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Production (Crates)</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Production (Pieces)</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Consumption</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"].map(room => (
                                            <tr key={room} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{room}</td>
                                                <td className="px-6 py-4 text-right font-medium text-blue-600">
                                                    {data?.rooms[room]?.eggs_produced_display?.crates || 0}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-blue-500">
                                                    {data?.rooms[room]?.eggs_produced_display?.pieces || 0}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-900 font-medium">
                                                    {data?.rooms[room]?.feeds_eaten || 0} <span className="text-gray-400 text-xs">bags</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Additional Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Feed Calculation Logic</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Registered Store Stock:</span>
                                        <span className="font-bold text-gray-900">{data?.feedStore?.feed_bags_in_store || 0} bags</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span className="font-medium">Less Total Consumption:</span>
                                        <span className="font-bold">-{data?.total_feeds_eaten || 0} bags</span>
                                    </div>
                                    <div className="pt-2 border-t border-dashed flex justify-between font-black text-gray-900">
                                        <span>Theoretical Balance:</span>
                                        <span className="text-lg underline decoration-green-500 decoration-4 underline-offset-4">
                                            {data?.feed_in_store_adjusted || 0} bags
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-center gap-6">
                                <div className="bg-amber-100 p-4 rounded-xl text-amber-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900 text-lg">Quick Tip</h3>
                                    <p className="text-amber-800 text-sm opacity-90 leading-relaxed">
                                        If the feed balance seems wrong, ensure all rooms have recorded their consumption for today.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
