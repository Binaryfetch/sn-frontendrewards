import React from "react";
import { motion } from "framer-motion";

export default function KpiCard({ label, value, sublabel, icon }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {sublabel && <p className="mt-1 text-sm text-gray-500">{sublabel}</p>}
    </motion.div>
  );
}

