// src/app/page.tsx
// Home page: Record Daily Production

import Link from "next/link";
import RecordDailyForm from "@/components/RecordDailyForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Record Daily Production
          </h1>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/init"
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Initialize Farm Rooms
            </Link>
            <Link
              href="/summary"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
            >
              📊 View Farm Summary
            </Link>
          </div>
        </div>

        {/* Main Form */}
        <RecordDailyForm />
      </div>
    </main>
  );
}
