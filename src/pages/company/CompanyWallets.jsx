import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getUserInvoices,
  companyDeductDistributor,
  companyDeductDealer,
  getDistributors,
  getAllDealers,
  getWalletTransactions
} from "../../api/api";
import Pagination from "../../components/ui/Pagination";
import { formatNumber } from "../../utils/formatters";

const tabOptions = [
  { id: "company", label: "My Transactions" },
  { id: "all", label: "Distributor → Dealer Transactions" }
];

export default function CompanyWallets() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [companyTransactions, setCompanyTransactions] = useState([]);
  const [tab, setTab] = useState("company");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [deductForm, setDeductForm] = useState({
    distributorId: "",
    dealerId: "",
    points: "",
    note: "",
    targetType: "distributor"
  });

  // LOAD DATA
  const loadData = async () => {
    setLoading(true);
    try {
      const [invoiceRes, distRes, dealerRes, walletRes] = await Promise.all([
        getUserInvoices(),
        getDistributors(),
        getAllDealers(),
        getWalletTransactions(1, 500)
      ]);

      setInvoices(invoiceRes.data.invoices || []);
      setDistributors(distRes.data.distributors || []);
      setDealers(dealerRes.data.dealers || []);
      setCompanyTransactions(walletRes.data?.transactions || []);

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // COMPANY'S OWN WALLET TRANSACTIONS
  const myTransactions = useMemo(
    () =>
      companyTransactions.map((tx) => ({
        id: tx._id,
        type: tx.type,
        points: tx.points || 0,
        date: tx.date || tx.createdAt,
        note: tx.note || "—",
        name: tx.performedBy?.name || "—"
      })),
    [companyTransactions]
  );

  // ONLY DISTRIBUTOR → DEALER INVOICE TXNS
  const distributorToDealerTransactions = useMemo(() => {
    return invoices
      .filter(
        (inv) =>
          inv.createdByRole === "Distributor" &&
          inv.toUser?.role === "Dealer"
      )
      .map((inv) => ({
        id: inv._id,
        type: "Credit",
        distributor: inv.fromUser?.name || "—",
        dealer: inv.toUser?.name || "—",
        invoiceNumber: inv.invoiceNumber || "—",
        points: inv.totalReward || 0,
        date: inv.invoiceDate || inv.createdAt,
        note: "Invoice reward"
      }));
  }, [invoices]);
  

  const dataset = tab === "company" ? myTransactions : distributorToDealerTransactions;
  const paged = dataset.slice((page - 1) * pageSize, page * pageSize);

  // MANUAL DEDUCTION
  const handleDeduct = async (event) => {
    event.preventDefault();

    if (!deductForm.distributorId && !deductForm.dealerId) {
      toast.error("Please select a distributor or dealer");
      return;
    }
    if (Number(deductForm.points) <= 0) {
      toast.error("Please enter a valid point amount");
      return;
    }

    try {
      if (deductForm.targetType === "distributor") {
        await companyDeductDistributor(
          deductForm.distributorId,
          Number(deductForm.points),
          deductForm.note
        );
      } else {
        await companyDeductDealer(
          deductForm.dealerId,
          Number(deductForm.points),
          deductForm.note
        );
      }

      toast.success("Points deducted successfully!");
      setDeductForm({
        distributorId: "",
        dealerId: "",
        points: "",
        note: "",
        targetType: "distributor"
      });

      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Failed to deduct points");
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Wallets</p>

      {/* TABS */}
      <div className="flex flex-wrap gap-3">
        {tabOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setTab(option.id);
              setPage(1);
            }}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${
              tab === option.id
                ? "border-gray-700 bg-gray-50 text-gray-900"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.3em] text-gray-500">
                {tab === "company" ? (
                  <tr>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Note</th>
                    <th className="px-4 py-3 text-right">Points</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Distributor</th>
                    <th className="px-4 py-3 text-left">Dealer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Points</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-gray-200">
                {paged.map((txn) => (
                  <tr key={txn.id}>
                    {tab === "company" ? (
                      <>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              txn.type === "Credit"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {txn.type}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {txn.name}
                        </td>

                        <td className="px-4 py-3">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3">{txn.note}</td>

                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            txn.type === "Credit"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {txn.type === "Credit" ? "+" : "-"}
                          {formatNumber(txn.points)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
                            Credit
                          </span>
                        </td>

                        <td className="px-4 py-3">{txn.invoiceNumber}</td>
                        <td className="px-4 py-3">{txn.distributor}</td>
                        <td className="px-4 py-3">{txn.dealer}</td>

                        <td className="px-4 py-3">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          +{formatNumber(txn.points)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={dataset.length}
            onChange={setPage}
          />
        </div>
      )}

      {/* DEDUCTION FORM */}
      <form
        onSubmit={handleDeduct}
        className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Manual adjustment
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Target Type
            <select
              value={deductForm.targetType}
              onChange={(e) =>
                setDeductForm((prev) => ({
                  ...prev,
                  targetType: e.target.value,
                  distributorId: "",
                  dealerId: ""
                }))
              }
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
            >
              <option value="distributor">Distributor</option>
              <option value="dealer">Dealer</option>
            </select>
          </label>

          {deductForm.targetType === "distributor" ? (
            <label className="text-sm font-medium text-gray-700">
              Distributor
              <select
                value={deductForm.distributorId}
                onChange={(e) =>
                  setDeductForm((prev) => ({
                    ...prev,
                    distributorId: e.target.value
                  }))
                }
                required
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
          ) : (
            <label className="text-sm font-medium text-gray-700">
              Dealer
              <select
                value={deductForm.dealerId}
                onChange={(e) =>
                  setDeductForm((prev) => ({
                    ...prev,
                    dealerId: e.target.value
                  }))
                }
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
              >
                <option value="">Select dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer._id} value={dealer._id}>
                    {dealer.name} ({dealer.mobile})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-sm font-medium text-gray-700">
            Points
            <input
              type="number"
              min="1"
              value={deductForm.points}
              onChange={(e) =>
                setDeductForm((prev) => ({ ...prev, points: e.target.value }))
              }
              required
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Note
            <input
              type="text"
              value={deductForm.note}
              onChange={(e) =>
                setDeductForm((prev) => ({ ...prev, note: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-2"
              placeholder="Optional"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-[#c7a13f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8912f]"
        >
          Deduct points
        </button>
      </form>
    </div>
  );
}
