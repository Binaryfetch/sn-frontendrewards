import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllDealers, uploadDealers } from "../../api/api";
import UploadCard from "../../components/ui/UploadCard";
import Pagination from "../../components/ui/Pagination";
import { buildCsvFile, formatNumber } from "../../utils/formatters";

export default function CompanyDealers() {
  const [loading, setLoading] = useState(true);
  const [dealers, setDealers] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [singleDealer, setSingleDealer] = useState({ name: "", phone: "", address: "", bpCode: "" });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const loadDealers = async () => {
    setLoading(true);
    try {
      const res = await getAllDealers();
      setDealers(res.data.dealers || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to load dealers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const handleDealerUpload = async ({ file, fields }) => {
    try {
      const form = new FormData();
      form.append("file", file);
      if (fields.bpCode) form.append("bpCode", fields.bpCode);
      const res = await uploadDealers(form);
      setUploadResult({
        title: "Dealer upload",
        message: `Success: ${res.data.successCount || 0} • Failed: ${res.data.failedCount || 0}`,
        details: res.data.failed?.slice(0, 3).map((row, idx) => `${idx + 1}. ${row.error}`).join("\n")
      });
      toast.success("Dealers uploaded");
      loadDealers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Upload failed");
    }
  };

  const handleSingleSubmit = async (event) => {
    event.preventDefault();
    const headers = ["Name", "Phone Number", "Address", "BP Code"];
    const csvFile = buildCsvFile(
      headers,
      {
        Name: singleDealer.name,
        "Phone Number": singleDealer.phone,
        Address: singleDealer.address,
        "BP Code": singleDealer.bpCode
      },
      "single-dealer.csv"
    );
    await handleDealerUpload({ file: csvFile, fields: { bpCode: singleDealer.bpCode } });
    setSingleDealer({ name: "", phone: "", address: "", bpCode: "" });
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredDealers = dealers.filter((dealer) => {
    const query = searchQuery.toLowerCase();
    return (
      dealer.name?.toLowerCase().includes(query) ||
      dealer.mobile?.toLowerCase().includes(query) ||
      dealer.address?.toLowerCase().includes(query) ||
      dealer.distributorID?.name?.toLowerCase().includes(query)
    );
  });

  const paged = filteredDealers.slice((page - 1) * pageSize, page * pageSize);

  const excelHeaders = ["Name", "Phone Number", "Address", "BP Code"];

  return (
    <div className="space-y-8">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Dealers</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Bulk Upload</p>
          <p className="text-sm text-gray-600 mb-4">Use the dealer template to add members under a distributor.</p>
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
            title="Bulk upload"
            description="Upload Excel file with dealer data."
            icon="👥"
            extraFields={[{ name: "bpCode", label: "Fallback Distributor BP Code" }]}
            onSubmit={handleDealerUpload}
            result={uploadResult}
          />
        </div>
        <form onSubmit={handleSingleSubmit} className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Single dealer</p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "name", label: "Name" },
              { name: "phone", label: "Phone Number" },
              { name: "address", label: "Address" },
              { name: "bpCode", label: "Distributor BP Code" }
            ].map((field) => (
              <label key={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                <input
                  required
                  type="text"
                  value={singleDealer[field.name]}
                  onChange={(e) => setSingleDealer((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                />
              </label>
            ))}
          </div>
          <button type="submit" className="rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white">
            Add dealer
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-100 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total dealers</span>
              <span className="ml-4">{formatNumber(filteredDealers.length)}</span>
            </div>
            <div className="flex-1 max-w-md ml-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search dealers..."
                className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
              />
            </div>
          </div>
          <div className="grid gap-4">
            {paged.map((dealer) => (
              <div key={dealer._id} className="flex flex-wrap items-center justify-between rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{dealer.name}</p>
                  <p className="text-xs text-gray-500">{dealer.distributorID?.name || "—"}</p>
                </div>
                <p className="text-sm text-gray-500">{dealer.mobile || "—"}</p>
                <p className="text-xs text-gray-400">{dealer.address || "—"}</p>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={filteredDealers.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

