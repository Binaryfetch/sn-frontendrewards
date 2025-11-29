import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getMyProductAllocations } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

export default function DealerAllProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

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

  return (
    <div className="space-y-8 text-white">
      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#08090c] via-[#101114] to-[#050506] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">All Products</h1>
        <p className="mt-2 text-sm text-gray-400">
          Every SKU that your distributor has made visible to you. Quantities per box and carton only.
        </p>
      </header>

      <div className="rounded-[28px] border border-white/10 bg-[#0b0c10] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
            <span>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or BP code"
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
            Visible products: <span className="font-semibold text-white">{filtered.length}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">BP code</th>
                <th className="px-4 py-3">Qty / box</th>
                <th className="px-4 py-3">Qty / carton</th>
                <th className="px-4 py-3">Sales UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Loading products…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product._id} className="hover:bg-white/5">
                    <td className="px-4 py-4">
                      <p className="text-base font-semibold text-white">
                        {product.itemDescription || product.name || "Product"}
                      </p>
                      <p className="text-xs text-gray-500">{product.brand || product.category || "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-300">{product.itemNo || "—"}</td>
                    <td className="px-4 py-4 text-gray-300">
                      {formatNumber(product.boxQuantity || 0)}
                    </td>
                    <td className="px-4 py-4 text-gray-300">
                      {formatNumber(product.cartonQuantity || 0)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                        {product.salesUom || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


