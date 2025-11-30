import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserInvoices } from "../../api/api";
import { formatNumber } from "../../utils/formatters";
import Pagination from "../../components/ui/Pagination";

const defaultFilters = { query: "", from: "", to: "" };

const applyFilters = (invoices = [], filters = defaultFilters) => {
  const search = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;

  return invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate || invoice.date || Date.now());
    const matchesText =
      !search ||
      [invoice.fromUser?.name, ...(invoice.items || []).map((it) => it.itemName || it.productID?.name || "")]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    const matchesFrom = !fromDate || invoiceDate >= fromDate;
    const matchesTo = !toDate || invoiceDate <= toDate;
    return matchesText && matchesFrom && matchesTo;
  });
};

export default function DealerInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getUserInvoices();
        setInvoices(res.data?.invoices || []);
      } catch (error) {
        console.error("Dealer invoices load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load invoices.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => applyFilters(invoices, filters), [invoices, filters]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Invoices</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">My Invoices</h1>
        <p className="mt-2 text-sm text-gray-600">
          Every invoice shared with you by your distributor. Product-level detail, quantities, and rewards—without clutter.
        </p>
      </header>

      <section className="rounded-[28px] border border-gray-200 bg-white p-8 space-y-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Search
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
              <span>🔍</span>
              <input
                name="query"
                value={filters.query}
                onChange={handleFilterChange}
                placeholder="Distributor or product"
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
            From
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f] shadow-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
            To
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f] shadow-sm"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500 bg-gray-50">
                <th className="px-4 py-3">From distributor</th>
                <th className="px-4 py-3">Products & quantities</th>
                <th className="px-4 py-3">Total quantity</th>
                <th className="px-4 py-3">Reward points</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    Loading invoices…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No invoices match your filters.
                  </td>
                </tr>
              ) : (
                paged.map((invoice) => {
                  const items = invoice.items || [];
                  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
                  const productsSummary =
                    items
                      .map((item) => {
                        const name = item.itemName || item.productID?.name || "Product";
                        const uom = item.uom || "";
                        return `${name} • ${item.qty} ${uom}`.trim();
                      })
                      .join(", ") || "—";

                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-4 text-gray-600">
                        <p className="font-semibold text-gray-900">
                          {invoice.fromUser?.name || "Distributor"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-600 max-w-xl">
                        <p className="text-xs leading-relaxed">{productsSummary}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{formatNumber(totalQty)}</td>
                      <td className="px-4 py-4 text-[#c7a13f] font-semibold">
                        {formatNumber(invoice.totalReward || 0)} pts
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {new Date(invoice.invoiceDate || invoice.date || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="mt-6">
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
          </div>
        )}
      </section>
    </div>
  );
}
