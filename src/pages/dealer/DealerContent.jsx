import React from "react";
import ContentView from "../../components/ContentView";

export default function DealerContent() {
  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">SN News</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">Content library</h1>
        <p className="mt-2 text-sm text-gray-600">
          Latest schemes, campaigns, and product stories from your distributor and SN Brothers.
        </p>
      </header>

      <div className="rounded-[32px] border border-gray-200 bg-white p-4 shadow-sm">
        <ContentView />
      </div>
    </div>
  );
}
