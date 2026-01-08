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
                    <div className="space-y-6 md:space-y-8">
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 md:p-6 rounded-2xl shadow-lg text-white">
                                <p className="text-blue-100 font-bold uppercase tracking-wider text-[10px] md:text-xs">Total Production</p>
                                <div className="mt-2 flex items-baseline flex-wrap gap-x-2 gap-y-0">
                                    <span className="text-3xl md:text-4xl font-black">{data?.total_eggs_display?.crates || 0}</span>
                                    <span className="text-blue-100 font-medium text-sm md:text-base">Crates</span>
                                    <span className="text-2xl md:text-2xl font-black ml-1">{data?.total_eggs_display?.pieces || 0}</span>
                                    <span className="text-blue-100 font-medium text-xs md:text-sm">Pieces</span>
                                </div>
                                <p className="mt-4 text-[10px] text-blue-100 opacity-70">Aggregated from all rooms</p>
                            </div>

                            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">Eggs in Store (Prev Day)</p>
                                <div className="mt-2 flex items-baseline flex-wrap gap-x-2 gap-y-0 text-gray-900">
                                    <span className="text-3xl md:text-4xl font-black">{Math.floor((data?.prevDayStock?.eggs || 0) / 30)}</span>
                                    <span className="text-gray-500 font-medium text-sm md:text-base">Crates</span>
                                    <span className="text-2xl md:text-2xl font-black ml-1">{(data?.prevDayStock?.eggs || 0) % 30}</span>
                                    <span className="text-gray-500 font-medium text-xs md:text-sm">Pieces</span>
                                </div>
                                <p className="mt-4 text-[10px] text-gray-400">Closing balance from yesterday</p>
                            </div>

                            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">Feed Drawdown Balance</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className={`text-3xl md:text-4xl font-black ${data?.feed_in_store_adjusted < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                        {data?.feed_in_store_adjusted || 0}
                                    </span>
                                    <span className="text-gray-500 font-medium text-sm md:text-base">Bags</span>
                                </div>
                                <p className="mt-4 text-[10px] text-gray-400">Yesterday's stock - today's usage</p>
                            </div>

                            <div className={`p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 ${data?.total_mortality > 0 ? 'bg-red-50/50 border-red-100' : 'bg-white'}`}>
                                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">Daily Mortality</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className={`text-3xl md:text-4xl font-black ${data?.total_mortality > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {data?.total_mortality || 0}
                                    </span>
                                    <span className="text-gray-500 font-medium text-sm md:text-base">Birds</span>
                                </div>
                                <p className="mt-4 text-[10px] text-gray-400">Sum of all room fatalities</p>
                            </div>
                        </div>

                        {/* Room Details Table - Desktop */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <h3 className="font-bold text-gray-900 text-sm md:text-lg">Room-by-Room Details</h3>
                                <span className="px-2 md:px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-full text-[9px] md:text-xs font-bold uppercase">Daily breakdown</span>
                            </div>

                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-50">
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Production (Crates)</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Production (Pieces)</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Feed Eaten</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Mortality</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"].map(room => (
                                            <tr key={room} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{room}</td>
                                                <td className="px-6 py-4 text-right font-semibold text-blue-600">
                                                    {data?.rooms[room]?.eggs_produced_display?.crates || 0}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-blue-400">
                                                    {data?.rooms[room]?.eggs_produced_display?.pieces || 0}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-700 font-medium">
                                                    {data?.rooms[room]?.feeds_eaten || 0}<span className="text-[10px] text-gray-400 ml-1">bags</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold">
                                                    <span className={data?.rooms[room]?.mortality_count > 0 ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-gray-400'}>
                                                        {data?.rooms[room]?.mortality_count || 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View (Cards) */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6"].map(room => (
                                    <div key={room} className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-gray-900 text-lg">{room}</span>
                                            <span className={data?.rooms[room]?.mortality_count > 0 ? 'text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold' : 'text-gray-400 text-xs'}>
                                                {data?.rooms[room]?.mortality_count || 0} Mortality
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                                <p className="text-[10px] text-blue-400 uppercase font-bold">Production</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-blue-600 font-black text-xl">{data?.rooms[room]?.eggs_produced_display?.crates || 0}</span>
                                                    <span className="text-blue-400 text-[10px] font-bold">C</span>
                                                    <span className="text-blue-600 font-black text-lg ml-1">{data?.rooms[room]?.eggs_produced_display?.pieces || 0}</span>
                                                    <span className="text-blue-400 text-[10px] font-bold">P</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Feed Eaten</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-gray-900 font-black text-xl">{data?.rooms[room]?.feeds_eaten || 0}</span>
                                                    <span className="text-gray-400 text-[10px] font-bold">bags</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Feed Drawdown Logic</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Yesterday's Closing Stock:</span>
                                        <span className="font-bold text-gray-900">{data?.prevDayStock?.feed || 0} bags</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span className="font-medium">Less Today's Consumption:</span>
                                        <span className="font-bold">-{data?.total_feeds_eaten || 0} bags</span>
                                    </div>
                                    <div className="pt-2 border-t border-dashed flex justify-between font-black text-gray-900">
                                        <span>Current Balance:</span>
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
