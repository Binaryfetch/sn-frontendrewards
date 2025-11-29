import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getAllProducts, getMyProductAllocations, getProfile } from "../api/api";

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [scope, setScope] = useState("all");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const profileRes = await getProfile();
      const role = profileRes.data.user.role;
      setUserRole(role);

      if (role === "Company") {
        const response = await getAllProducts();
        setProducts(response.data.products || []);
        setScope("all");
      } else {
        const allocationsRes = await getMyProductAllocations();
        const { scope: apiScope = "allocated", products: allocated = [] } = allocationsRes.data || {};
        setScope(apiScope);
        setProducts(allocated || []);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Unable to load products. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    const description = (product.itemDescription || product.name || "").toLowerCase();
    const itemNo = (product.itemNo || "").toLowerCase();
    const allocationInfo = product.allocation ? String(product.allocation.qty).toLowerCase() : "";
    return description.includes(search) || itemNo.includes(search) || allocationInfo.includes(search);
  });

  const renderInvoiceAction = (product) => {
    const availableQty = product.allocation?.qty || 0;
    const canInvoice = userRole === "Company" || availableQty > 0;

    return (
      <button
        type="button"
        onClick={() =>
          toast.success(
            userRole === "Company"
              ? `Open the invoice tab to allocate ${product.itemDescription || product.itemNo}.`
              : `Navigate to invoices to allocate ${availableQty} units of ${product.itemDescription || product.itemNo}.`
          )
        }
        disabled={!canInvoice}
        className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
          canInvoice
            ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {canInvoice ? "Invoice" : "Out of stock"}
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-3xl border border-white/60 bg-white/90 shadow-xl p-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Product catalog</p>
          <h1 className="text-3xl font-semibold text-gray-900">Available products</h1>
          <p className="text-gray-500">Live view of every SKU and distributor allocation.</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-gray-900">{products.length}</p>
          <p className="text-sm text-gray-500">Tracked SKUs</p>
        </div>
      </div>

      {scope === "allocated" && (
        <div className="rounded-3xl border border-accent-200 bg-accent-50/60 p-6 flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 text-white flex items-center justify-center">
            ⭐
          </div>
          <div>
            <p className="text-sm font-semibold text-accent-800">
              Allocated by {userRole === "Distributor" ? "Company HQ" : "your Distributor"}
            </p>
            <p className="text-sm text-accent-700">
              Inventory updates automatically whenever a new invoice arrives. Quantities shown below are live.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/70 bg-white p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">🔍</div>
          <input
            type="text"
            placeholder="Search products by item number or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 pl-12 pr-4 py-3 focus:ring-2 focus:ring-accent-200 focus:border-accent-300"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/80 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No products match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Item No</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Rewards / piece</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Available stock</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const rewardsPerPiece = product.rewardsPerPc ?? product.pointsPerUnit ?? 0;
                  const availablePieces =
                    userRole === "Company"
                      ? "Unlimited"
                      : `${product.allocation?.qty || 0} ${product.allocation?.uom || ""}`;
                  return (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50/60"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-semibold">
                            {(product.itemDescription || product.itemNo || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.itemDescription || product.name}</p>
                            <p className="text-xs text-gray-500">
                              Box {product.boxQuantity || 0} • Carton {product.cartonQuantity || 0}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.itemNo || "—"}</td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">{rewardsPerPiece.toLocaleString()} pts</td>
                      <td className="px-6 py-4 text-gray-700">{availablePieces}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            product.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{renderInvoiceAction(product)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredProducts.length > 0 && (
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
          {searchTerm && ` for “${searchTerm}”`}
        </div>
      )}
    </div>
  );
}
