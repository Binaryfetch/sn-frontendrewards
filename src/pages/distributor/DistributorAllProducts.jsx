import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAllProducts } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

export default function DistributorAllProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [uomFilter, setUomFilter] = useState("ALL");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await getAllProducts();
        setProducts(res.data?.products || []);
      } catch (error) {
        console.error("All products load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to fetch company products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !query ||
        (product.itemDescription || product.name || "").toLowerCase().includes(query) ||
        (product.itemNo || "").toLowerCase().includes(query);
      const matchesUom = uomFilter === "ALL" || product.salesUom === uomFilter;
      return matchesQuery && matchesUom;
    });
  }, [products, search, uomFilter]);

  return (
    <div className="space-y-8 text-white">
      <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0a0b0f] via-[#101114] to-[#050506] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">All products</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Catalog from company HQ</h1>
        <p className="mt-2 text-sm text-gray-400">
          Instantly reference every SKU that can be allocated to you. Filter by unit-of-measure or search by BP code.
        </p>
      </header>

      <div className="rounded-[28px] border border-white/10 bg-[#0b0c10] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
            <span>🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or BP code"
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
            />
          </div>
          <select
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
            value={uomFilter}
            onChange={(event) => setUomFilter(event.target.value)}
          >
            {["ALL", "PIECE", "DOZEN", "BOX", "CARTON"].map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All units" : option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500">
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">BP code</th>
                <th className="px-4 py-4">Sales UOM</th>
                <th className="px-4 py-4">Rewards / unit</th>
                <th className="px-4 py-4">Carton qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Loading catalog…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                        {product.salesUom || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#f5c66f]">
                      {formatNumber(
                        product.rewardsPerPc ||
                          product.rewardsForBox ||
                          product.rewardsForCarton ||
                          product.rewardsPerDozen ||
                          0
                      )}{" "}
                      pts
                    </td>
                    <td className="px-4 py-4 text-gray-300">
                      {product.cartonQuantity || product.boxQuantity || "—"}
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


