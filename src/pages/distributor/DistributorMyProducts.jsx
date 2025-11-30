import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getMyProductAllocations, getProfile, getUserInvoices } from "../../api/api";
import { formatNumber } from "../../utils/formatters";
import Pagination from "../../components/ui/Pagination";

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

const calculateAvailableUnits = (product, availablePieces) => {
  const pieces = Number(availablePieces) || 0;
  if (!product || pieces <= 0) return { pieces: 0, dozens: 0, boxes: 0, cartons: 0 };
  
  const boxQty = Number(product.boxQuantity) || 1;
  const cartonQty = Number(product.cartonQuantity) || 1;
  
  return {
    pieces: pieces,
    dozens: Math.floor(pieces / 12),
    boxes: boxQty > 0 ? Math.floor(pieces / boxQty) : 0,
    cartons: cartonQty > 0 ? Math.floor(pieces / cartonQty) : 0
  };
};

export default function DistributorMyProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

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

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Inventory focus</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">My Products</h1>
            <p className="mt-2 text-sm text-gray-600">
              Clean cards with live balance so you know exactly what can be invoiced out.
            </p>
          </div>
          <div className="w-full md:w-72">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
              <span>🔍</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or BP code"
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </label>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-64 rounded-[28px] border border-gray-200 bg-white animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
          No products found for "{search || "your filters"}".
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((product) => {
              const availablePieces = product?.allocation?.pieces || 0;
              const availableUnits = calculateAvailableUnits(product, availablePieces);
              
              return (
                <article
                  key={product._id}
                  className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm uppercase tracking-[0.3em] text-gray-500">BP code</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{product.itemNo || "—"}</p>
                      <h2 className="mt-4 text-xl font-semibold text-gray-900">
                        {product.itemDescription || product.name || "Product"}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        Updated {product.lastReceipt ? new Date(product.lastReceipt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-500">UOM</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{product?.allocation?.uom || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-500 mb-2">Available stock</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Pieces:</span>
                          <span className="ml-2 font-semibold text-gray-900">{formatNumber(availableUnits.pieces)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Dozens:</span>
                          <span className="ml-2 font-semibold text-gray-900">{formatNumber(availableUnits.dozens)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Boxes:</span>
                          <span className="ml-2 font-semibold text-gray-900">{formatNumber(availableUnits.boxes)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cartons:</span>
                          <span className="ml-2 font-semibold text-gray-900">{formatNumber(availableUnits.cartons)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Balance readiness</span>
                      <span>
                        {product.receivedQty
                          ? Math.min(100, Math.round(((product?.allocation?.qty || 0) / product.receivedQty) * 100)) || 0
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#c7a13f] to-[#d4b15a]"
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
              );
            })}
          </div>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </>
      )}
    </div>
  );
}
