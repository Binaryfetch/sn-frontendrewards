import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getWalletBalance, getWalletTransactions } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

export default function DealerWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [balanceRes, txRes] = await Promise.all([
          getWalletBalance(),
          getWalletTransactions(1, 50)
        ]);
        setBalance(balanceRes.data?.balance || 0);
        setTransactions(txRes.data?.transactions || []);
      } catch (error) {
        console.error("Dealer wallet load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load wallet.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const credits = useMemo(() => transactions.filter((t) => t.type === "Credit"), [transactions]);
  const debits = useMemo(() => transactions.filter((t) => t.type === "Debit"), [transactions]);

  return (
    <div className="space-y-8">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Wallet</p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Reward activity</h1>
            <p className="mt-2 text-sm text-gray-600">
              Clear separation between points received from your distributor and points deducted.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-8 py-5 text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Current balance</p>
            <p className="mt-2 text-4xl font-semibold text-gray-900">{formatNumber(balance)} pts</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionColumn
          title="Credits (from Distributor)"
          description="Points that your distributor has added to your wallet."
          data={credits}
          loading={loading}
          tone="credit"
        />
        <TransactionColumn
          title="Debits (by Distributor)"
          description="Points that your distributor has reduced from your wallet."
          data={debits}
          loading={loading}
          tone="debit"
        />
      </div>
    </div>
  );
}

function TransactionColumn({ title, description, data, loading, tone }) {
  const emptyText = tone === "credit" ? "No credits yet." : "No debits yet.";
  const icon = tone === "credit" ? "⬆️" : "⬇️";
  const accent =
    tone === "credit"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{title}</p>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${accent}`}>{icon}</span>
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
                    {tone === "credit" ? "From Distributor" : "By Distributor"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tx.note || (tone === "credit" ? "Invoice credit" : "Manual adjustment")}
                  </p>
                </div>
                <div className={`text-right text-lg font-semibold ${tone === "credit" ? "text-green-600" : "text-red-600"}`}>
                  {tone === "credit" ? "+" : "-"}
                  {formatNumber(tx.points)}
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-gray-600 sm:grid-cols-2">
                <Detail label="Product" value={resolveProductName(tx)} />
                <Detail label="Quantity" value={resolveQuantity(tx)} />
                <Detail
                  label="Rewards"
                  value={`${formatNumber(tx.points)} pts`}
                />
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
      <span className="text-gray-900 font-medium">{value || "—"}</span>
    </p>
  );
}

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
