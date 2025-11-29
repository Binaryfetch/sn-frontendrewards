import React from "react";
import Pagination from "./Pagination";

export default function DataTable({
  columns = [],
  data = [],
  renderEmpty,
  page,
  pageSize,
  total,
  onPageChange
}) {
  if (!data.length && renderEmpty) {
    return renderEmpty;
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {data.map((row) => (
              <tr key={row.id || row._id || row.invoiceNumber}>
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page && pageSize && (
        <div className="border-t border-gray-100 p-4">
          <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

