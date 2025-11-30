import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getMyProductAllocations } from "../../api/api";
import { formatNumber } from "../../utils/formatters";
import Pagination from "../../components/ui/Pagination";

export default function DealerAllProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMyProductAllocations();
        setProducts(res.data?.products || []);
      } catch (error) {
        console.error("Dealer all products load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.itemDescription || p.name || "").toLowerCase();
      const code = (p.itemNo || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [products, search]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">All Products</h1>
        <p className="mt-2 text-sm text-gray-600">
          Every SKU that your distributor has made visible to you. Quantities per box and carton only.
        </p>
      </header>

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            <span>🔍</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or BP code"
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Visible products: <span className="font-semibold text-gray-900">{filtered.length}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500 bg-gray-50">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">BP code</th>
                <th className="px-4 py-3">Qty / box</th>
                <th className="px-4 py-3">Qty / carton</th>
                <th className="px-4 py-3">Sales UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    Loading products…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                paged.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="text-base font-semibold text-gray-900">
                        {product.itemDescription || product.name || "Product"}
                      </p>
                      <p className="text-xs text-gray-500">{product.brand || product.category || "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{product.itemNo || "—"}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatNumber(product.boxQuantity || 0)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatNumber(product.cartonQuantity || 0)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                        {product.salesUom || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="mt-6">
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
