import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createDistributorInvoice,
  getInvoiceFormData,
  getProfile,
  getUserInvoices
} from "../../api/api";
import ProductSelector from "../../components/invoice/ProductSelector";
import { formatNumber } from "../../utils/formatters";

const defaultFilters = { query: "", from: "", to: "" };

const applyFilters = (invoices = [], filters = defaultFilters) => {
  const search = filters.query.trim().toLowerCase();
  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;

  return invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate || invoice.date || Date.now());
    const matchesSearch =
      !search ||
      [invoice.invoiceNumber, invoice.toUser?.name, invoice.fromUser?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    const matchesFrom = !fromDate || invoiceDate >= fromDate;
    const matchesTo = !toDate || invoiceDate <= toDate;
    return matchesSearch && matchesFrom && matchesTo;
  });
};

export default function DistributorInvoices() {
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtersSent, setFiltersSent] = useState(defaultFilters);
  const [filtersReceived, setFiltersReceived] = useState(defaultFilters);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [dealers, setDealers] = useState([]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [profileRes, invoiceRes, formDataRes] = await Promise.all([
          getProfile(),
          getUserInvoices(),
          getInvoiceFormData()
        ]);

        setProfile(profileRes.data?.user || null);
        setInvoices(invoiceRes.data?.invoices || []);
        setProducts(formDataRes.data?.products || []);
        setDealers(formDataRes.data?.counterparties || []);
      } catch (error) {
        console.error("Distributor invoices load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load invoices.");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const myInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.createdByRole === "Distributor"),
    [invoices]
  );

  const receivedInvoices = useMemo(() => {
    if (!profile?._id) return [];
    return invoices.filter((invoice) => {
      const toUserId = invoice.toUser?._id || invoice.toUser;
      return (
        invoice.createdByRole === "Company" &&
        String(toUserId) === String(profile._id)
      );
    });
  }, [invoices, profile?._id]);

  const rewardPointsIssued = myInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalReward || 0),
    0
  );

  const handleInvoiceCreated = async (payload) => {
    setFormLoading(true);
    try {
      await createDistributorInvoice(payload);
      toast.success("Invoice shared with dealer.");
      setDrawerOpen(false);
      const refreshed = await getUserInvoices();
      setInvoices(refreshed.data?.invoices || []);
    } catch (error) {
      console.error("Distributor invoice creation failed:", error);
      toast.error(error?.response?.data?.msg || "Unable to create invoice.");
    } finally {
      setFormLoading(false);
    }
  };

  const companyList = receivedInvoices.slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Invoices</p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Precision over every hand-off</h1>
            <p className="mt-2 text-sm text-gray-600">
              Segment between company allocations and dealer issues. Search, filter, and create invoices without leaving
              this screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#c7a13f] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b8912f] transition hover:-translate-y-0.5"
          >
            <span className="mr-2 text-lg">✦</span>
            Create invoice
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Total invoices (to dealers)" value={formatNumber(myInvoices.length)} icon="📄" />
        <MetricCard label="Reward points issued" value={`${formatNumber(rewardPointsIssued)} pts`} icon="⭐" />
        <MetricCard label="Invoices from company" value={formatNumber(receivedInvoices.length)} icon="🏢" />
      </div>

      <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Invoices from Company</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Recent hand-offs</h2>
            <p className="mt-1 text-sm text-gray-600">Latest allocations received from HQ.</p>
          </div>
          <span className="text-3xl text-[#c7a13f]">⟲</span>
        </div>

        {loading ? (
          <div className="mt-6 h-28 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
        ) : companyList.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No invoices received from company yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {companyList.map((invoice) => (
              <article
                key={invoice._id}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{invoice.fromUser?.name || "Company"}</p>
                    <p className="text-xs text-gray-500">
                      Invoice {invoice.invoiceNumber || invoice._id.slice(-6)} •{" "}
                      {new Date(invoice.invoiceDate || invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[#c7a13f]">
                      {formatNumber(invoice.totalReward || 0)} pts
                    </p>
                    <p className="text-xs text-gray-500">
                      {invoice.items?.length || 0} items • {formatNumber(invoice.totalQty || 0)} qty
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <InvoiceTable
        title="My Invoices"
        subtitle="Invoices issued to dealers."
        data={myInvoices}
        filters={filtersSent}
        onFiltersChange={setFiltersSent}
        loading={loading}
        emptyMessage="Create your first invoice to see it here."
      />

      <InvoiceTable
        title="My Purchases"
        subtitle="Invoices received from company."
        data={receivedInvoices}
        filters={filtersReceived}
        onFiltersChange={setFiltersReceived}
        loading={loading}
        emptyMessage="No purchases from company yet."
      />

      {drawerOpen && (
        <InvoiceDrawer
          onClose={() => setDrawerOpen(false)}
          onSubmit={handleInvoiceCreated}
          products={products}
          dealers={dealers}
          loading={formLoading}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InvoiceTable({ title, subtitle, data, filters, onFiltersChange, loading, emptyMessage }) {
  const filteredRows = useMemo(() => applyFilters(data, filters), [data, filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    onFiltersChange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-8 space-y-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Search
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span>🔍</span>
            <input
              name="query"
              value={filters.query}
              onChange={handleChange}
              placeholder="Invoice no, dealer"
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
            />
          </div>
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
          From
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
          To
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.3em] text-gray-500 bg-gray-50">
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Counterparty</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Rewards</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  Loading invoices…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {invoice.invoiceNumber || `#${invoice._id.slice(-6)}`}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {invoice.createdByRole === "Distributor" ? invoice.toUser?.name : invoice.fromUser?.name || "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{invoice.items?.length || 0}</td>
                  <td className="px-4 py-4 text-gray-600">{formatNumber(invoice.totalQty || 0)}</td>
                  <td className="px-4 py-4 text-[#c7a13f] font-semibold">{formatNumber(invoice.totalReward || 0)} pts</td>
                  <td className="px-4 py-4 text-gray-600">
                    {new Date(invoice.invoiceDate || invoice.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoiceDrawer({ onClose, onSubmit, products, dealers, loading }) {
  const [form, setForm] = useState({
    dealerId: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    notes: "",
    rewardPoints: ""
  });
  const [items, setItems] = useState([]);

  const summary = useInvoiceSummary(items, products);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!items.length) {
      toast.error("Add at least one product.");
      return;
    }

    const rewardPoints =
      form.rewardPoints !== "" && Number(form.rewardPoints) >= 0
        ? Number(form.rewardPoints)
        : summary.totalReward;

    const payload = {
      dealerId: form.dealerId,
      invoiceDate: form.invoiceDate,
      invoiceNumber: form.invoiceNumber,
      notes: form.notes,
      rewardPoints,
      items: buildPayloadItems(items)
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Distributor → Dealer</p>
            <h2 className="mt-2 text-3xl font-semibold text-gray-900">New invoice</h2>
            <p className="mt-2 text-sm text-gray-600">
              Select your dealer, add products, decide the rewards you want to pass along.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Dealer *
              <select
                name="dealerId"
                value={form.dealerId}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
              >
                <option value="">Select dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer._id} value={dealer._id}>
                    {dealer.name} 
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Invoice date *
              <input
                type="date"
                name="invoiceDate"
                value={form.invoiceDate}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Invoice number
              <input
                type="text"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                placeholder="Optional"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Reward points
              <input
                type="number"
                name="rewardPoints"
                min="0"
                value={form.rewardPoints}
                onChange={handleChange}
                placeholder={`Default: ${formatNumber(Math.round(summary.totalReward))}`}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Dealer specific instructions…"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
            />
          </label>

          <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-6">
            <ProductSelector products={products} items={items} onChange={setItems} />
          </div>

          <div className="rounded-[28px] border border-[#c7a13f]/30 bg-gray-50 p-6 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Items: <strong>{summary.totalItems}</strong>
              </span>
              <span>
                Quantity: <strong>{formatNumber(summary.totalQty)}</strong>
              </span>
              <span>
                Rewards (est.): <strong>{formatNumber(Math.round(summary.totalReward))} pts</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.dealerId || !items.length}
              className="rounded-2xl border border-transparent bg-[#c7a13f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b8912f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sharing…" : "Share invoice"}
            </button>
          </div>
        </form>
      </div>
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


