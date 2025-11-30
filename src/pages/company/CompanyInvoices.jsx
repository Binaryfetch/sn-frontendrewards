import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserInvoices, uploadInvoices, createCompanyInvoice, getDistributors, getAllProductsAdmin } from "../../api/api";
import UploadCard from "../../components/ui/UploadCard";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import ProductSelector from "../../components/invoice/ProductSelector";
import { formatNumber } from "../../utils/formatters";

export default function CompanyInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [filters, setFilters] = useState({ query: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [distributors, setDistributors] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    toUserId: "",
    customerBpCode: "",
    items: [],
    notes: ""
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await getUserInvoices();
      setInvoices(res.data.invoices || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [distRes, prodRes] = await Promise.all([getDistributors(), getAllProductsAdmin()]);
      setDistributors(distRes.data.distributors || []);
      setProducts(prodRes.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to load form data");
    }
  };

  useEffect(() => {
    loadInvoices();
    loadFormData();
  }, []);

  const handleUpload = async ({ file, fields }) => {
    try {
      const res = await uploadInvoices(file, undefined, fields.invoiceDate);
      setUploadResult({
        title: "Invoice upload",
        message: `Success: ${res.data.successCount || 0} • Failed: ${res.data.failedCount || 0}`,
        details: res.data.failed?.slice(0, 3).map((row, idx) => `${idx + 1}. ${row.error}`).join("\n")
      });
      toast.success("Invoices uploaded");
      loadInvoices();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Upload failed");
    }
  };
  const companyInvoices = useMemo(() => invoices.filter((invoice) => invoice.fromUser?.role === "Company" && invoice.toUser?.role === "Distributor"), [invoices]);
  const filteredCompany = useMemo(() => {
    return companyInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate || invoice.date || Date.now());
  
      const matchText = filters.query
        ? [invoice.invoiceNumber, invoice.fromUser?.name, invoice.toUser?.name]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(filters.query.toLowerCase()))
        : true;
  
      const matchFrom = filters.from ? invoiceDate >= new Date(filters.from) : true;
      const matchTo = filters.to ? invoiceDate <= new Date(filters.to) : true;
  
      return matchText && matchFrom && matchTo;
    });
  }, [filters, companyInvoices]);
  

  
  const distributorToDealerInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.createdByRole === "Distributor" && invoice.toUser?.role === "Dealer"),
    [invoices]
  );
  const companyPoints = companyInvoices.reduce((sum, invoice) => sum + Number(invoice.totalReward || 0), 0);

  const paged = filteredCompany.slice((page - 1) * pageSize, page * pageSize);

  // const Companypaged = companyInvoices.slice((page - 1) * pageSize, page * pageSize);
  const distributorPaged = distributorToDealerInvoices.slice((page - 1) * pageSize, page * pageSize);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.toUserId && !invoiceForm.customerBpCode) {
      toast.error("Please select a distributor or enter BP Code");
      return;
    }
    if (!invoiceForm.items || invoiceForm.items.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    try {
      const payload = {
        items: invoiceForm.items.map((item) => ({
          productID: item.productID,
          qty: item.qty,
          uom: item.uom
        })),
        invoiceDate: invoiceForm.invoiceDate,
        invoiceNumber: invoiceForm.invoiceNumber,
        notes: invoiceForm.notes,
        customerBpCode: invoiceForm.customerBpCode,
        toUserId: invoiceForm.toUserId
      };
      await createCompanyInvoice(payload);
      toast.success("Invoice created successfully");
      setShowCreateForm(false);
      setInvoiceForm({ invoiceNumber: "", invoiceDate: "", toUserId: "", customerBpCode: "", items: [], notes: "" });
      loadInvoices();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to create invoice");
    }
  };

  const excelHeaders = [
    "Invoice Number",
    "ItemCode",
    "ItemName",
    "Customer/Vendor Code",
    "Customer/Vendor Name",
    "Quantity",
    "UOM",
    "Amount"
  ];

  return (
    <div className="space-y-8">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Invoices</p>
      
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Bulk Upload</p>
            <p className="text-sm text-gray-600">Matches the standard template. Invoice date required.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8912f]"
          >
            Create Invoice
          </button>
        </div>
        <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Required Excel Headers:</p>
          <div className="flex flex-wrap gap-2">
            {excelHeaders.map((header, idx) => (
              <span key={idx} className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                {header}
              </span>
            ))}
          </div>
        </div>
        <UploadCard
          title="Upload invoice Excel"
          description="Upload Excel file with invoice data."
          icon="📄"
          extraFields={[
            { name: "invoiceDate", label: "Invoice Date", type: "date", required: true, placeholder: "YYYY-MM-DD" }
          ]}
          onSubmit={handleUpload}
          result={uploadResult}
        />
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Create Invoice</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setInvoiceForm({ invoiceNumber: "", invoiceDate: "", toUserId: "", customerBpCode: "", items: [], notes: "" });
                }}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Invoice Number
                  <input
                    type="text"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Invoice Date
                  <input
                    type="date"
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                    required
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Distributor
                  <select
                    value={invoiceForm.toUserId}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, toUserId: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  >
                    <option value="">Select distributor</option>
                    {distributors.map((dist) => (
                      <option key={dist._id} value={dist._id}>
                        {dist.name} ({dist.bpCode})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {products.length > 0 && (
                <ProductSelector
                  products={products}
                  items={invoiceForm.items}
                  onChange={(items) => setInvoiceForm((prev) => ({ ...prev, items }))}
                  userRole="Company"
                  showStock={false}
                />
              )}
              <label className="text-sm font-medium text-gray-700">
                Notes (optional)
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  rows={2}
                />
              </label>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button type="submit" className="flex-1 rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8912f]">
                  Create Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setInvoiceForm({ invoiceNumber: "", invoiceDate: "", toUserId: "", customerBpCode: "", items: [], notes: "" });
                  }}
                  className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Company invoices</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(companyInvoices.length)}</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Total invoices</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(invoices.length)}</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Company rewards</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(companyPoints)} pts</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Company Invoices</p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Search
            <input
              type="text"
              value={filters.query}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, query: e.target.value }));
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
              placeholder="Invoice, distributor, dealer"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            From date
            <input
              type="date"
              value={filters.from}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, from: e.target.value }));
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            To date
            <input
              type="date"
              value={filters.to}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, to: e.target.value }));
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          </div>
        ) : (
          <>
            <DataTable
              columns={[
                // { key: "invoiceNumber", label: "Invoice" },
                {
                  key: "fromUser",
                  label: "From",
                  render: (_, row) => `${row.fromUser?.name || "—"} (${row.createdByRole})`
                },
                {
                  key: "toUser",
                  label: "To",
                  render: (_, row) => row.toUser?.name || "—"
                },
                {
                  key: "totalQty",
                  label: "Total Qty",
                  render: (value) => formatNumber(value || 0)
                },
                {
                  key: "items",
                  label: "Unit of Measure",
                  render: (_, row) => row.items?.map((item) => item.uom).join(", ") || "—"
                },
                {
                  key: "items",
                  label: "Line items",
                  render: (_, row) =>
                    row.items
                      ?.map((item) => `${item.itemName || item.productID?.name} • ${item.qty} ${item.uom}`)
                      .join(", ") || "—"
                },
                {
                  key: "invoiceDate",
                  label: "Date",
                  render: (value, row) => new Date(value || row.date).toLocaleDateString()
                },
                {
                  key: "totalReward",
                  label: "Rewards",
                  render: (value) => `${formatNumber(value || 0)} pts`
                }
              ]}
              data={paged}
            />
            <Pagination
  page={page}
  pageSize={pageSize}
  total={filteredCompany.length}
  onChange={setPage}
/>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Distributor to Dealer Invoices</p>
        {distributorToDealerInvoices.length === 0 ? (
          <p className="text-sm text-gray-500">No distributor-to-dealer invoices yet.</p>
        ) : (
          <>
            <DataTable
              columns={[
                // { key: "invoiceNumber", label: "Invoice" },
                {
                  key: "fromUser",
                  label: "Distributor",
                  render: (_, row) => row.fromUser?.name || "—"
                },
                {
                  key: "toUser",
                  label: "Dealer",
                  render: (_, row) => row.toUser?.name || "—"
                },
                {
                  key: "totalQty",
                  label: "Total Qty",
                  render: (value) => formatNumber(value || 0)
                },
                {
                  key: "items",
                  label: "Line items",
                  render: (_, row) =>
                    row.items
                      ?.map((item) => `${item.itemName || item.productID?.name} • ${item.qty} ${item.uom}`)
                      .join(", ") || "—"
                },
                {
                  key: "invoiceDate",
                  label: "Date",
                  render: (value, row) => new Date(value || row.date).toLocaleDateString()
                },
                {
                  key: "totalReward",
                  label: "Rewards",
                  render: (value) => `${formatNumber(value || 0)} pts`
                }
              ]}
              data={distributorPaged}
            />
            <Pagination page={page} pageSize={pageSize} total={distributorToDealerInvoices.length} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

