import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UploadCard from "../../components/ui/UploadCard";
import { uploadDealers, getDealers, createDealer, updateDealer } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

export default function DistributorUploadDealers() {
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    companyName: "",
    businessType: ""
  });

  const loadDealers = async () => {
    setLoading(true);
    try {
      const res = await getDealers();
      setDealers(res.data?.dealers || []);
    } catch (error) {
      console.error("Failed to load dealers:", error);
      toast.error(error?.response?.data?.msg || "Failed to load dealers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const handleUpload = async ({ file }) => {
    if (!file) {
      toast.error("Select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setSubmitting(true);
    try {
      const res = await uploadDealers(formData);
      const success = res.data?.successCount ?? 0;
      const failed = res.data?.failedCount ?? 0;
      setResult({
        title: "Bulk dealer upload",
        message: `Success: ${success} • Failed: ${failed}`,
        details: res.data?.failed
          ?.map((row, index) => `${index + 1}. ${row.error}`)
          .slice(0, 5)
          .join("\n")
      });
      toast.success(res.data?.msg || "Dealer list processed.");
      loadDealers();
    } catch (error) {
      console.error("Dealer upload failed:", error);
      toast.error(error?.response?.data?.msg || "Unable to upload dealers.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      toast.error("Name and mobile are required");
      return;
    }

    try {
      await createDealer(formData);
      toast.success("Dealer created successfully");
      setShowAddModal(false);
      setFormData({ name: "", mobile: "", email: "", address: "", companyName: "", businessType: "" });
      loadDealers();
    } catch (error) {
      console.error("Create dealer failed:", error);
      toast.error(error?.response?.data?.msg || "Failed to create dealer");
    }
  };

  const handleEditClick = (dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name || "",
      mobile: dealer.mobile || "",
      email: dealer.email || "",
      address: dealer.address || "",
      companyName: dealer.companyName || "",
      businessType: dealer.businessType || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      toast.error("Name and mobile are required");
      return;
    }

    try {
      await updateDealer(editingDealer._id, formData);
      toast.success("Dealer updated successfully");
      setShowEditModal(false);
      setEditingDealer(null);
      setFormData({ name: "", mobile: "", email: "", address: "", companyName: "", businessType: "" });
      loadDealers();
    } catch (error) {
      console.error("Update dealer failed:", error);
      toast.error(error?.response?.data?.msg || "Failed to update dealer");
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingDealer(null);
    setFormData({ name: "", mobile: "", email: "", address: "", companyName: "", businessType: "" });
  };

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Bulk onboarding</p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Upload dealer roster</h1>
            <p className="mt-2 text-sm text-gray-600">
              Use the official spreadsheet template so every dealer receives access instantly. Upload status and backend
              messages appear below in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#c7a13f] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b8912f]"
          >
            <span className="mr-2 text-lg">➕</span>
            Single Dealer Add
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Bulk add instructions</h2>
          <ul className="mt-6 space-y-3 text-sm text-gray-600">
            <li>• Keep phone numbers unique and include ISD code when possible.</li>
            <li>• Company name + city help finance identify invoices quickly.</li>
            <li>• Reward wallet is activated automatically after a successful upload.</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-[#c7a13f]/30 bg-gray-50 p-4 text-sm text-gray-700">
            Pro tip: use the same file naming format as company invoice upload so compliance reports stay aligned.
          </div>
        </section>

        <UploadCard
          title="Upload Excel / CSV"
          description="Drop the SN Bulk Dealer template here. Accepted formats: .xlsx, .xls, .csv"
          icon="📥"
          ctaLabel="Upload dealer list"
          onSubmit={handleUpload}
          isSubmitting={submitting}
          result={result}
        />
      </div>

      {/* Dealers List */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">My Dealers</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              {loading ? "Loading..." : `${formatNumber(dealers.length)} dealers`}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          </div>
        ) : dealers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No dealers found. Add dealers using bulk upload or single dealer add.
          </div>
        ) : (
          <div className="space-y-4">
            {dealers.map((dealer) => (
              <div
                key={dealer._id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900">{dealer.name || "Dealer"}</p>
                  <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    {dealer.mobile && <p>📱 {dealer.mobile}</p>}
                    {dealer.email && <p>✉️ {dealer.email}</p>}
                    {dealer.address && <p>📍 {dealer.address}</p>}
                    {dealer.companyName && <p>🏢 {dealer.companyName}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleEditClick(dealer)}
                  className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Dealer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add New Dealer</h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Name *
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Mobile *
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700">
                  Address
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>
                
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8912f]"
                >
                  Add Dealer
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dealer Modal */}
      {showEditModal && editingDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Dealer</h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Name *
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Mobile *
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Address
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                  />
                </label>

              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8912f]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
