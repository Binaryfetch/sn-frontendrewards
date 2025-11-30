import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  distributorDeductDealer,
  getDealers,
  getWalletBalance,
  getWalletTransactions
} from "../../api/api";
import { formatNumber } from "../../utils/formatters";

export default function DistributorWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [deductForm, setDeductForm] = useState({ dealerId: "", points: "", note: "" });
  const [deductLoading, setDeductLoading] = useState(false);

  useEffect(() => {
    const loadWallet = async () => {
      setLoading(true);
      try {
        const [balanceRes, txRes, dealersRes] = await Promise.all([
          getWalletBalance(),
          getWalletTransactions(1, 50),
          getDealers()
        ]);

        setBalance(balanceRes.data?.balance || 0);
        setTransactions(txRes.data?.transactions || []);
        setDealers(dealersRes.data?.dealers || []);
      } catch (error) {
        console.error("Distributor wallet load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load wallet activity.");
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const credits = useMemo(() => transactions.filter((tx) => tx.type === "Credit"), [transactions]);
  const debits = useMemo(() => transactions.filter((tx) => tx.type === "Debit"), [transactions]);

  const handleDeduct = async (event) => {
    event.preventDefault();
    if (!deductForm.dealerId || Number(deductForm.points) <= 0) {
      toast.error("Enter a valid points value.");
      return;
    }

    setDeductLoading(true);
    try {
      await distributorDeductDealer(deductForm.dealerId, Number(deductForm.points), deductForm.note);
      toast.success("Points deducted from dealer.");
      setDeductForm({ dealerId: "", points: "", note: "" });
      setDeductModalOpen(false);

      const refreshed = await getWalletTransactions(1, 50);
      setTransactions(refreshed.data?.transactions || []);
      const balanceRes = await getWalletBalance();
      setBalance(balanceRes.data?.balance || 0);
    } catch (error) {
      console.error("Deduct points failed:", error);
      toast.error(error?.response?.data?.msg || "Unable to deduct points.");
    } finally {
      setDeductLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Wallet</p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Reward flow control</h1>
            <p className="mt-2 text-sm text-gray-600">
              Separate credit inflows from company and debit outflows to dealers. Every transaction is time stamped and
              labelled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeductModalOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#c7a13f] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b8912f]"
          >
            <span className="mr-2 text-lg">➖</span>
            Deduct points
          </button>
        </div>
      </header>

      <section className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Current balance</p>
            <p className="mt-3 text-5xl font-semibold text-gray-900">{formatNumber(balance)} pts</p>
            <p className="mt-2 text-sm text-gray-600">All credits minus debits in real time.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-700">
            Credits recorded: <strong>{credits.length}</strong>
            <br />
            Debits recorded: <strong>{debits.length}</strong>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionColumn title="Credits (From Company)" data={credits} loading={loading} tone="credit" />
        <TransactionColumn title="Debits (To Dealers)" data={debits} loading={loading} tone="debit" />
      </div>

      {deductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-900">Deduct points</h2>
            <p className="mt-2 text-sm text-gray-600">Move reward points from your wallet to a dealer.</p>

            <form onSubmit={handleDeduct} className="mt-6 space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Dealer *
                <select
                  name="dealerId"
                  value={deductForm.dealerId}
                  onChange={(event) => setDeductForm((prev) => ({ ...prev, dealerId: event.target.value }))}
                  required
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
                >
                  <option value="">Select dealer</option>
                  {dealers.map((dealer) => (
                    <option key={dealer._id} value={dealer._id}>
                      {dealer.name} ({dealer.bpCode || "No BP"})
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Points *
                <input
                  type="number"
                  min="1"
                  value={deductForm.points}
                  onChange={(event) => setDeductForm((prev) => ({ ...prev, points: event.target.value }))}
                  required
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Note
                <input
                  type="text"
                  value={deductForm.note}
                  onChange={(event) => setDeductForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Optional context"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f]"
                />
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setDeductModalOpen(false)}
                  className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deductLoading}
                  className="rounded-2xl border border-transparent bg-[#c7a13f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b8912f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deductLoading ? "Processing…" : "Deduct now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionColumn({ title, data, loading, tone }) {
  const emptyText = tone === "credit" ? "No credits yet." : "No debits yet.";
  const icon = tone === "credit" ? "⬆️" : "⬇️";
  const accent =
    tone === "credit"
      ? "border-green-500/40 text-green-600 bg-green-50"
      : "border-red-500/40 text-red-600 bg-red-50";

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{data.length} records</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accent}`}>{icon}</span>
      </div>

      {loading ? (
        <div className="mt-6 h-32 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
      ) : data.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((tx) => (
            <article key={tx._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {tone === "credit" ? "From Company" : "To Dealer"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {tone === "credit" ? tx.performedBy?.name || "HQ" : tx.note || "Manual transfer"}
                  </p>
                </div>
                <div className={`text-right text-lg font-semibold ${tone === "credit" ? "text-green-600" : "text-red-600"}`}>
                  {tone === "credit" ? "+" : "-"}
                  {formatNumber(tx.points)}
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-gray-600 sm:grid-cols-2">
                <Detail label="Dealer" value={resolveDealerName(tx)} />
                <Detail label="Product" value={resolveProductName(tx)} />
                <Detail label="Quantity" value={resolveQuantity(tx)} />
                <Detail
                  label="Date"
                  value={new Date(tx.date || tx.createdAt).toLocaleDateString()}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <p>
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-900">{value || "—"}</span>
    </p>
  );
}

const resolveDealerName = (transaction) => {
  const normalizedNote = transaction.note?.toLowerCase?.();
  if (normalizedNote?.includes("dealer")) return transaction.note;
  const allocation = transaction.allocatedProducts?.[0];
  const dealer = transaction.targetDealer || transaction.toUser;
  return dealer?.name || allocation?.dealerName || "—";
};

const resolveProductName = (transaction) => {
  const allocation = transaction.allocatedProducts?.[0];
  if (!allocation) return "—";
  return allocation.productID?.itemDescription || allocation.productID?.name || "SKU";
};

const resolveQuantity = (transaction) => {
  const allocation = transaction.allocatedProducts?.[0];
  if (!allocation) return "—";
  return `${formatNumber(allocation.qty)} ${allocation.uom}`;
};


