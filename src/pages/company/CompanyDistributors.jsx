import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDistributors, uploadDistributors } from "../../api/api";
import UploadCard from "../../components/ui/UploadCard";
import Pagination from "../../components/ui/Pagination";
import { buildCsvFile, formatNumber } from "../../utils/formatters";

export default function CompanyDistributors() {
  const [loading, setLoading] = useState(true);
  const [distributors, setDistributors] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [singleDistributor, setSingleDistributor] = useState({
    bpCode: "",
    bpName: "",
    mobile: "",
    state: ""
  });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const loadDistributors = async () => {
    setLoading(true);
    try {
      const res = await getDistributors();
      setDistributors(res.data.distributors || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to load distributors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistributors();
  }, []);

  const handleDistributorUpload = async ({ file }) => {
    try {
      const res = await uploadDistributors(file);
      setUploadResult({
        title: "Distributor upload",
        message: `Success: ${res.data.successCount || 0} • Failed: ${res.data.failedCount || 0}`,
        details: res.data.failed?.slice(0, 3).map((row, idx) => `${idx + 1}. ${row.error}`).join("\n")
      });
      toast.success("Distributors uploaded");
      loadDistributors();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Upload failed");
    }
  };

  const handleSingleSubmit = async (event) => {
    event.preventDefault();
    const headers = ["BP Code", "BP Name", "Mobile Phone", "Bill-to State"];
    const file = buildCsvFile(
      headers,
      {
        "BP Code": singleDistributor.bpCode,
        "BP Name": singleDistributor.bpName,
        "Mobile Phone": singleDistributor.mobile,
        "Bill-to State": singleDistributor.state
      },
      "single-distributor.csv"
    );
    await handleDistributorUpload({ file });
    setSingleDistributor({ bpCode: "", bpName: "", mobile: "", state: "" });
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredDistributors = distributors.filter((dist) => {
    const query = searchQuery.toLowerCase();
    return (
      dist.name?.toLowerCase().includes(query) ||
      dist.bpCode?.toLowerCase().includes(query) ||
      dist.mobile?.toLowerCase().includes(query) ||
      dist.billToState?.toLowerCase().includes(query)
    );
  });

  const paged = filteredDistributors.slice((page - 1) * pageSize, page * pageSize);

  const excelHeaders = ["BP Code", "BP Name", "Mobile Phone", "Bill-to State"];

  return (
    <div className="space-y-8">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Distributors</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Bulk Upload</p>
          <p className="text-sm text-gray-600 mb-4">Use the distributor template to onboard multiple partners.</p>
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
            description="Upload Excel file with distributor data."
            icon="🏢"
            onSubmit={handleDistributorUpload}
            result={uploadResult}
          />
        </div>
        <form onSubmit={handleSingleSubmit} className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Single distributor</p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "bpCode", label: "BP Code" },
              { name: "bpName", label: "BP Name" },
              { name: "mobile", label: "Mobile Phone" },
              { name: "state", label: "Bill-to State" }
            ].map((field) => (
              <label key={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                <input
                  required
                  type="text"
                  value={singleDistributor[field.name]}
                  onChange={(e) => setSingleDistributor((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
                />
              </label>
            ))}
          </div>
          <button type="submit" className="rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white">
            Add distributor
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
              <span>Total distributors</span>
              <span className="ml-4">{formatNumber(filteredDistributors.length)}</span>
            </div>
            <div className="flex-1 max-w-md ml-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search distributors..."
                className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
              />
            </div>
          </div>
          <div className="grid gap-4">
            {paged.map((dist) => (
              <div key={dist._id} className="flex flex-wrap items-center justify-between rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{dist.name}</p>
                  <p className="text-xs text-gray-500">BP: {dist.bpCode || "—"}</p>
                </div>
                <p className="text-sm text-gray-500">{dist.billToState || "—"}</p>
                <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-semibold text-white">{dist.mobile || "—"}</span>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={filteredDistributors.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

