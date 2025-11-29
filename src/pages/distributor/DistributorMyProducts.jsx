import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getMyProductAllocations, getProfile, getUserInvoices } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

const summarizeIncomingProducts = (invoiceRecords = [], receiverId) => {
  if (!receiverId) return new Map();
  const target = String(receiverId);
  const summary = new Map();

  invoiceRecords.forEach((invoice) => {
    const toId = invoice.toUser?._id || invoice.toUser;
    if (String(toId) !== target) return;
    if (invoice.createdByRole !== "Company") return;

    (invoice.items || []).forEach((item) => {
      const productId = item.productID?._id || item.productID || item.itemCode;
      if (!productId) return;
      const existing = summary.get(productId) || { totalQty: 0, lastDate: null };
      existing.totalQty += Number(item.qty || 0);
      const invoiceDate = new Date(invoice.invoiceDate || invoice.date || Date.now());
      if (!existing.lastDate || invoiceDate > existing.lastDate) {
        existing.lastDate = invoiceDate;
      }
      summary.set(productId, existing);
    });
  });

  return summary;
};

export default function DistributorMyProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const [profileRes, allocationRes, invoicesRes] = await Promise.all([
          getProfile(),
          getMyProductAllocations(),
          getUserInvoices()
        ]);

        const userId = profileRes.data?.user?._id;
        const incomingSummary = summarizeIncomingProducts(invoicesRes.data?.invoices, userId);

        const enriched = (allocationRes.data?.products || []).map((product) => {
          const allocation = product.allocation || {};
          const received = incomingSummary.get(product._id) || incomingSummary.get(product.productID?._id) || {
            totalQty: 0,
            lastDate: null
          };

          return {
            ...product,
            receivedQty: received.totalQty || allocation.qty || 0,
            lastReceipt: received.lastDate
          };
        });

        setProducts(enriched);
      } catch (error) {
        console.error("Distributor products load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load allocated products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const name = (product.itemDescription || product.name || "").toLowerCase();
      const code = (product.itemNo || "").toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [products, search]);

  return (
    <div className="space-y-8 text-white">
      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#090a0d] via-[#101114] to-[#050506] p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Inventory focus</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">My Products</h1>
            <p className="mt-2 text-sm text-gray-400">
              Clean cards with live balance so you know exactly what can be invoiced out.
            </p>
          </div>
          <div className="w-full md:w-72">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
              <span>🔍</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or BP code"
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
              />
            </label>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-48 rounded-[28px] border border-white/10 bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/15 bg-[#0b0c10] p-10 text-center text-gray-400">
          No products found for “{search || "your filters"}”.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article
              key={product._id}
              className="rounded-[28px] border border-white/10 bg-[#0b0c10] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)] hover:border-[#f5c66f]/60 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-500">BP code</p>
                  <p className="mt-1 text-lg font-semibold text-white">{product.itemNo || "—"}</p>
                  <h2 className="mt-4 text-2xl font-semibold text-white">
                    {product.itemDescription || product.name || "Product"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Updated {product.lastReceipt ? new Date(product.lastReceipt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-500">UOM</p>
                  <p className="mt-1 text-lg font-semibold text-white">{product?.allocation?.uom || "—"}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Quantity received</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatNumber(product.receivedQty || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Available balance</p>
                  <p className="mt-2 text-2xl font-semibold text-[#f5c66f]">
                    {formatNumber(product?.allocation?.qty || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Balance readiness</span>
                  <span>{product.receivedQty ? Math.min(100, Math.round((product?.allocation?.qty || 0) / product.receivedQty * 100)) || 0 : 0}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#f5c66f] to-[#f9d992]"
                    style={{
                      width: `${Math.min(
                        100,
                        product.receivedQty
                          ? Math.round(((product?.allocation?.qty || 0) / product.receivedQty) * 100)
                          : 0
                      )}%`
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


