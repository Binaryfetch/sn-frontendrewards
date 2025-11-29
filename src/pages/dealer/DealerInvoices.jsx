import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserInvoices } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

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

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 text-white">
      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#08090c] via-[#101114] to-[#050506] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Invoices</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">My Invoices</h1>
        <p className="mt-2 text-sm text-gray-400">
          Every invoice shared with you by your distributor. Product-level detail, quantities, and rewards—without clutter.
        </p>
      </header>

      <section className="rounded-[28px] border border-white/10 bg-[#0b0c10] p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Search
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
              <span>🔍</span>
              <input
                name="query"
                value={filters.query}
                onChange={handleFilterChange}
                placeholder="Distributor or product"
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
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
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
            To
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500">
                <th className="px-4 py-3">From distributor</th>
                <th className="px-4 py-3">Products & quantities</th>
                <th className="px-4 py-3">Total quantity</th>
                <th className="px-4 py-3">Reward points</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Loading invoices…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No invoices match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => {
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
                    <tr key={invoice._id} className="hover:bg-white/5 align-top">
                      <td className="px-4 py-4 text-gray-200">
                        <p className="font-semibold text-white">
                          {invoice.fromUser?.name || "Distributor"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-300 max-w-xl">
                        <p className="text-xs leading-relaxed">{productsSummary}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-200">{formatNumber(totalQty)}</td>
                      <td className="px-4 py-4 text-[#f5c66f]">
                        {formatNumber(invoice.totalReward || 0)} pts
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {new Date(invoice.invoiceDate || invoice.date || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


