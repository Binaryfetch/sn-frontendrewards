import React from "react";
import ContentView from "../../components/ContentView";

export default function DealerContent() {
  return (
    <div className="space-y-8 text-white">
      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#08090c] via-[#101114] to-[#050506] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">SN News</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Content library</h1>
        <p className="mt-2 text-sm text-gray-400">
          Latest schemes, campaigns, and product stories from your distributor and SN Brothers.
        </p>
      </header>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-4 text-gray-900">
        <ContentView />
      </div>
    </div>
  );
}


