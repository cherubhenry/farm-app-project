// src/app/init/page.tsx
// Initialize Farm Rooms page

import Link from "next/link";
import InitRoomsForm from "@/components/InitRoomsForm";

export default function InitPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Initialize Farm Rooms
                    </h1>
                    <Link
                        href="/"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors text-lg font-semibold"
                    >
                        Proceed to Record Production
                    </Link>
                </div>

                {/* Init Form */}
                <InitRoomsForm />
            </div>
        </main>
    );
}
