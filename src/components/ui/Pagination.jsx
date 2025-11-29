import React from "react";

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const go = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    onChange?.(nextPage);
  };

  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <p>
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => go(page - 1)}
          className="rounded-xl border border-gray-200 px-3 py-1 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => go(page + 1)}
          className="rounded-xl border border-gray-200 px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

