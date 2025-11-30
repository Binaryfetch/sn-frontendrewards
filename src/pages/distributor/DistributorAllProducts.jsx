import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAllProducts } from "../../api/api";
import { formatNumber } from "../../utils/formatters";
import Pagination from "../../components/ui/Pagination";

export default function DistributorAllProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [uomFilter, setUomFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

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

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">All products</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Catalog from company HQ</h1>
        <p className="mt-2 text-sm text-gray-600">
          Instantly reference every SKU that can be allocated to you. Filter by unit-of-measure or search by BP code.
        </p>
      </header>

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            <span>🔎</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by product name or BP code"
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <select
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f] shadow-sm"
            value={uomFilter}
            onChange={(event) => {
              setUomFilter(event.target.value);
              setPage(1);
            }}
          >
            {["ALL", "PIECE", "DOZEN", "BOX", "CARTON"].map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All units" : option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500 bg-gray-50">
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">BP code</th>
                <th className="px-4 py-4">Sales UOM</th>
                <th className="px-4 py-4">Rewards / unit</th>
                <th className="px-4 py-4">Carton qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading catalog…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                        {product.salesUom || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#c7a13f] font-semibold">
                      {formatNumber(
                        product.rewardsPerPc ||
                          product.rewardsForBox ||
                          product.rewardsForCarton ||
                          product.rewardsPerDozen ||
                          0
                      )}{" "}
                      pts
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {product.cartonQuantity || product.boxQuantity || "—"}
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
