import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  createCompanyInvoice,
  createDistributorInvoice,
  getUserInvoices,
  getInvoiceSummary,
  getInvoiceFormData,
  getProfile
} from "../api/api";
import ProductSelector from "./invoice/ProductSelector";

export default function InvoiceManagement({ onInvoiceCreated }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my-invoices');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await getProfile();
        setRole(profile.data.user.role);
      } catch (e) {
        // ignore; role remains null
      }
      await loadInvoiceData();
      await loadFormData();
    };
    init();
  }, []);

  const loadInvoiceData = async () => {
    try {
      // Fetch the profile
      const profileRes = await getProfile();
      const userRole = profileRes.data.user.role;
  
      // Always call same API – backend already filters by role
      const invoicesRes = await getUserInvoices();
      console.log(invoicesRes);
      // Summary also based on role
      const summaryRes = await getInvoiceSummary(userRole);
  
      // Apply data
      setInvoices(invoicesRes.data.invoices);
      setSummary(summaryRes.data);
  
      console.log("Loaded invoices:", invoicesRes.data.invoices);
  
    } catch (error) {
      console.error("Error loading invoice data:", error);
    }
  };
  
  

  const loadFormData = async () => {
    try {
      const res = await getInvoiceFormData();
      setProducts(res.data.products || []);
      setUsers(res.data.counterparties || []);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  const handleCompanySubmit = async (payload) => {
    setLoading(true);
    try {
      await createCompanyInvoice(payload);
      setActiveForm(null);
      await loadInvoiceData();
      await loadFormData();
      onInvoiceCreated?.();
      toast.success("Invoice created for distributor.");
    } catch (error) {
      console.error("Error creating company invoice:", error);
      toast.error(error.response?.data?.msg || "Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleDistributorSubmit = async (payload) => {
    setLoading(true);
    try {
      await createDistributorInvoice(payload);
      setActiveForm(null);
      await loadInvoiceData();
      await loadFormData();
      onInvoiceCreated?.();
      toast.success("Invoice created for dealer.");
    } catch (error) {
      console.error("Error creating distributor invoice:", error);
      toast.error(error.response?.data?.msg || "Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl shadow-yellow-500/20 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-300/70 mb-2">Invoice control center</p>
            <h1 className="text-3xl font-bold text-white mb-2">Invoice Management</h1>
            <p className="text-base text-gray-200 max-w-2xl">
              Seamlessly allocate products, credit rewards, and keep Company → Distributor → Dealer hand-offs tightly monitored.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setActiveForm(role === "Distributor" ? "distributor" : "company")}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-semibold text-gray-900 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="mr-2 text-lg">✦</span>
              Create Invoice
            </button>
            <button
              onClick={loadInvoiceData}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/30 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/60 bg-white shadow-lg shadow-blue-500/10 p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Total invoices</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold text-gray-900">{summary.totalInvoices}</p>
                <p className="text-sm text-gray-500 mt-1">All time</p>
              </div>
              <span className="text-2xl">📄</span>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-white shadow-lg shadow-yellow-200/50 p-6">
            <p className="text-xs uppercase tracking-wide text-yellow-700 mb-2">Reward points</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold text-yellow-900">{summary.totalPoints.toLocaleString()}</p>
                <p className="text-sm text-yellow-700/80 mt-1">Allocated to network</p>
              </div>
              <span className="text-2xl">⭐</span>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white shadow-lg shadow-purple-200/50 p-6">
            <p className="text-xs uppercase tracking-wide text-purple-700 mb-2">Recent hand-offs</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold text-purple-900">{summary.recentInvoices.length}</p>
                <p className="text-sm text-purple-700/80 mt-1">Last five recorded</p>
              </div>
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('my-invoices')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'my-invoices'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">📄</span>
                <span>My Invoices</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'recent'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🕒</span>
                <span>Recent Activity</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-8">
        {activeTab === 'my-invoices' && (
  <div>
    <h2 className="text-lg font-medium text-gray-900 mb-6">My Invoice History</h2>

    {invoices.length === 0 ? (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
        <p className="text-gray-500 mb-4">Create your first invoice to get started</p>

        <button
          onClick={() => setActiveForm(role === "Distributor" ? "distributor" : "company")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          + Create Invoice
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div key={invoice._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📄</span>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Invoice #{invoice._id.slice(-6)}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {(invoice.fromUser?.name || "Unknown")} 
                    {" → "}
                    {(invoice.toUser?.name || "Unknown")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-primary-600">
                  {(invoice.totalReward ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">transferred</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Products:</span>
                <span className="ml-2 font-medium">
                  {invoice.items
                    ?.map((item) => 
                      item.itemName || 
                      item.productID?.name || 
                      item.itemCode)
                    .join(", ")}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Items:</span>
                <span className="ml-2 font-medium">{invoice.items?.length || 0}</span>
              </div>

              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(invoice.invoiceDate || invoice.date || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    )}
  </div>
)}



{activeTab === 'recent' && summary && (
  <div>
    <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h2>

    <div className="space-y-4">
      {summary.recentInvoices.map((invoice) => (
        <div key={invoice._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📄</span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {(invoice.fromUser?.name || "Unknown")} → {(invoice.toUser?.name || "Unknown")}
                </h3>

                <p className="text-xs text-gray-500">
                  {(invoice.items?.[0]?.productID?.name 
                    || invoice.items?.[0]?.itemName 
                    || "No Product")}
                  {" • "}
                  {new Date(invoice.date || invoice.invoiceDate || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-primary-600">
                {(invoice.totalReward || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">transferred</div>
            </div>
          </div>

        </div>
      ))}
    </div>
  </div>
)}

        </div>
      </div>

      {/* Invoice Form Modal */}
      {activeForm && (
        <InvoiceFormShell onClose={() => setActiveForm(null)}>
          {activeForm === "company" ? (
            <CompanyInvoiceForm
              products={products}
              distributors={users}
              onSubmit={handleCompanySubmit}
              onCancel={() => setActiveForm(null)}
              loading={loading}
            />
          ) : (
            <DistributorInvoiceForm
              products={products}
              dealers={users}
              onSubmit={handleDistributorSubmit}
              onCancel={() => setActiveForm(null)}
              loading={loading}
            />
          )}
        </InvoiceFormShell>
      )}
    </div>
  );
}

const normalizeReward = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getRewardPerUnit = (product, uom) => {
  if (!product) return 0;
  if (uom === "PIECE") return normalizeReward(product.rewardsPerPc);
  if (uom === "DOZEN") return normalizeReward(product.rewardsPerDozen, normalizeReward(product.rewardsPerPc) * 12);
  if (uom === "BOX") {
    const qty = normalizeReward(product.boxQuantity);
    return normalizeReward(product.rewardsForBox, normalizeReward(product.rewardsPerPc) * qty);
  }
  if (uom === "CARTON") {
    const qty = normalizeReward(product.cartonQuantity);
    return normalizeReward(product.rewardsForCarton, normalizeReward(product.rewardsPerPc) * qty);
  }
  return 0;
};

const buildPayloadItems = (items) =>
  items.map((item) => ({
    productID: item.productID,
    qty: item.qty,
    uom: item.uom,
    amount: item.amount || 0
  }));

const useInvoiceSummary = (items, products) =>
  useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const product = products.find((prod) => prod._id === item.productID);
        const rewardPerUnit = getRewardPerUnit(product, item.uom);
        acc.totalQty += item.qty;
        acc.totalItems += 1;
        acc.totalReward += rewardPerUnit * item.qty;
        return acc;
      },
      { totalQty: 0, totalItems: 0, totalReward: 0 }
    );
  }, [items, products]);

const InvoiceFormShell = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-start justify-center py-10 px-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        aria-label="Close form"
      >
        ✕
      </button>
      <div className="p-8">{children}</div>
    </div>
  </div>
);

const CompanyInvoiceForm = ({ products, distributors = [], onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    toUserId: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    notes: ""
  });
  const [items, setItems] = useState([]);

  const summary = useInvoiceSummary(items, products);
  const selectedDistributor = distributors.find((dist) => dist._id === formData.toUserId);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!items.length) {
      return;
    }

    const payload = {
      toUserId: formData.toUserId,
      customerBpCode: selectedDistributor?.bpCode,
      invoiceDate: formData.invoiceDate,
      invoiceNumber: formData.invoiceNumber,
      notes: formData.notes,
      items: buildPayloadItems(items)
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Company → Distributor Invoice</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select the distributor, add products, choose invoice date, and rewards will be credited automatically.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Distributor *</label>
          <select
            name="toUserId"
            value={formData.toUserId}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-xl"
          >
            <option value="">Select distributor</option>
            {distributors.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.bpCode || "No BP"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice date *</label>
          <input
            type="date"
            name="invoiceDate"
            value={formData.invoiceDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice number</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="Optional"
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Additional context"
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
        </div>
      </div>

      <ProductSelector products={products} items={items} onChange={setItems} />

      <InvoiceSummaryPanel summary={summary} counterpartName={selectedDistributor?.name} />

      <FormActions loading={loading} onCancel={onCancel} canSubmit={Boolean(formData.toUserId && items.length)} />
    </form>
  );
};

const DistributorInvoiceForm = ({ products, dealers = [], onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    dealerId: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    notes: "",
    rewardPoints: ""
  });
  const [items, setItems] = useState([]);

  const summary = useInvoiceSummary(items, products);
  const selectedDealer = dealers.find((dealer) => dealer._id === formData.dealerId);
  const rewardLimit = selectedDealer?.dealerRewardLimit || 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!items.length) return;

    let rewardPointsValue =
      formData.rewardPoints === "" ? summary.totalReward : Number(formData.rewardPoints);
    if (!Number.isFinite(rewardPointsValue) || rewardPointsValue < 0) {
      rewardPointsValue = summary.totalReward;
    }

    const payload = {
      dealerId: formData.dealerId,
      invoiceDate: formData.invoiceDate,
      invoiceNumber: formData.invoiceNumber,
      notes: formData.notes,
      rewardPoints: rewardPointsValue,
      items: buildPayloadItems(items)
    };
    onSubmit(payload);
  };

  const rewardHint =
    rewardLimit > 0 ? `Dealer limit: ${rewardLimit} pts` : "Leave blank to transfer all earned rewards.";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Distributor → Dealer Invoice</h2>
        <p className="text-sm text-gray-500 mt-1">
          Allocate stock and set the reward points you want to pass to your dealer.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dealer *</label>
          <select
            name="dealerId"
            value={formData.dealerId}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-xl"
          >
            <option value="">Select dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer._id} value={dealer._id}>
                {dealer.name} ({dealer.bpCode || "No BP"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice date *</label>
          <input
            type="date"
            name="invoiceDate"
            value={formData.invoiceDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice number</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="Optional"
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reward points to transfer</label>
          <input
            type="number"
            name="rewardPoints"
            value={formData.rewardPoints}
            onChange={handleChange}
            min="0"
            placeholder={rewardHint}
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
          <p className="text-xs text-gray-500 mt-1">{rewardHint}</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Additional details"
            className="mt-1 block w-full border-gray-300 rounded-xl"
          />
        </div>
      </div>

      <ProductSelector products={products} items={items} onChange={setItems} />

      <InvoiceSummaryPanel
        summary={summary}
        counterpartName={selectedDealer?.name}
        rewardOverride={formData.rewardPoints}
      />

      <FormActions loading={loading} onCancel={onCancel} canSubmit={Boolean(formData.dealerId && items.length)} />
    </form>
  );
};

const InvoiceSummaryPanel = ({ summary, counterpartName, rewardOverride }) => {
  const rewardValueRaw = rewardOverride === "" ? summary.totalReward : Number(rewardOverride || summary.totalReward);
  const rewardValue = Number.isFinite(rewardValueRaw) ? rewardValueRaw : summary.totalReward;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Summary</h3>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Counterparty</p>
          <p className="text-lg font-semibold text-gray-900">{counterpartName || "Not selected"}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Total items</p>
          <p className="text-lg font-semibold text-gray-900">{summary.totalItems}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Total qty</p>
          <p className="text-lg font-semibold text-gray-900">{summary.totalQty}</p>
        </div>
      </div>
      <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-primary-700">Reward allocation</p>
          <p className="text-2xl font-bold text-primary-900">{rewardValue.toLocaleString()} pts</p>
        </div>
        <span className="text-xs text-primary-600">Calculated in real time from product + unit selection</span>
      </div>
    </div>
  );
};

const FormActions = ({ loading, onCancel, canSubmit }) => (
  <div className="flex justify-end space-x-3 pt-4">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading || !canSubmit}
      className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
    >
      {loading ? "Saving..." : "Create Invoice"}
    </button>
  </div>
);
