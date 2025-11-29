import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserInvoices, getDistributors } from "../../api/api";
import KpiCard from "../../components/ui/KpiCard";
import { formatNumber } from "../../utils/formatters";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function CompanyAnalytics() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [distributors, setDistributors] = useState([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [invoiceRes, distRes] = await Promise.all([getUserInvoices(), getDistributors()]);
        setInvoices(invoiceRes.data.invoices || []);
        setDistributors(distRes.data.distributors || []);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.msg || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const topDealers = useMemo(() => {
    const totals = invoices.reduce((acc, invoice) => {
      if (invoice.toUser?.role !== "Dealer") return acc;
      const key = invoice.toUser._id;
      acc[key] = acc[key] || { name: invoice.toUser.name, points: 0 };
      acc[key].points += Number(invoice.totalReward || 0);
      return acc;
    }, {});
    return Object.values(totals).sort((a, b) => b.points - a.points).slice(0, 5);
  }, [invoices]);

  const topDistributors = useMemo(() => {
    const totals = invoices.reduce((acc, invoice) => {
      const dist =
        invoice.createdByRole === "Company"
          ? invoice.toUser
          : invoice.fromUser?.role === "Distributor"
          ? invoice.fromUser
          : null;
      if (!dist?._id) return acc;
      const key = dist._id;
      acc[key] = acc[key] || { name: dist.name, points: 0, lastInvoice: null };
      acc[key].points += Number(invoice.totalReward || 0);
      const date = invoice.invoiceDate || invoice.date;
      if (!acc[key].lastInvoice || new Date(date) > new Date(acc[key].lastInvoice)) {
        acc[key].lastInvoice = date;
      }
      return acc;
    }, {});
    return Object.values(totals).sort((a, b) => b.points - a.points).slice(0, 5);
  }, [invoices]);

  const worstDistributor = useMemo(() => {
    const lastMap = distributors.reduce((acc, dist) => {
      acc[dist._id] = { name: dist.name, bpCode: dist.bpCode, lastInvoice: null };
      return acc;
    }, {});
    invoices
      .filter((invoice) => invoice.createdByRole === "Distributor")
      .forEach((invoice) => {
        const id = invoice.fromUser?._id;
        if (!id || !lastMap[id]) return;
        const date = invoice.invoiceDate || invoice.date;
        if (!lastMap[id].lastInvoice || new Date(date) > new Date(lastMap[id].lastInvoice)) {
          lastMap[id].lastInvoice = date;
        }
      });
    return Object.values(lastMap).sort(
      (a, b) => new Date(a.lastInvoice || 0) - new Date(b.lastInvoice || 0)
    )[0];
  }, [distributors, invoices]);

  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const companyToDistributor30DaysList = useMemo(() => {
    const filtered = invoices.filter(
      (inv) =>
        inv.createdByRole === "Company" &&
        inv.toUser?.role === "Distributor" &&
        new Date(inv.invoiceDate || inv.date) >= last30Days
    );
    const grouped = filtered.reduce((acc, inv) => {
      const distId = inv.toUser?._id;
      const distName = inv.toUser?.name || "Unknown";
      if (!acc[distId]) {
        acc[distId] = { name: distName, count: 0 };
      }
      acc[distId].count += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [invoices]);

  const companyToDistributor90DaysList = useMemo(() => {
    const filtered = invoices.filter(
      (inv) =>
        inv.createdByRole === "Company" &&
        inv.toUser?.role === "Distributor" &&
        new Date(inv.invoiceDate || inv.date) >= last90Days
    );
    const grouped = filtered.reduce((acc, inv) => {
      const distId = inv.toUser?._id;
      const distName = inv.toUser?.name || "Unknown";
      if (!acc[distId]) {
        acc[distId] = { name: distName, count: 0 };
      }
      acc[distId].count += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [invoices]);

  const distributorToDealer30DaysList = useMemo(() => {
    const filtered = invoices.filter(
      (inv) =>
        inv.createdByRole === "Distributor" &&
        inv.toUser?.role === "Dealer" &&
        new Date(inv.invoiceDate || inv.date) >= last30Days
    );
    const grouped = filtered.reduce((acc, inv) => {
      const dealerId = inv.toUser?._id;
      const dealerName = inv.toUser?.name || "Unknown";
      if (!acc[dealerId]) {
        acc[dealerId] = { name: dealerName, count: 0 };
      }
      acc[dealerId].count += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [invoices]);

  const distributorToDealer90DaysList = useMemo(() => {
    const filtered = invoices.filter(
      (inv) =>
        inv.createdByRole === "Distributor" &&
        inv.toUser?.role === "Dealer" &&
        new Date(inv.invoiceDate || inv.date) >= last90Days
    );
    const grouped = filtered.reduce((acc, inv) => {
      const dealerId = inv.toUser?._id;
      const dealerName = inv.toUser?.name || "Unknown";
      if (!acc[dealerId]) {
        acc[dealerId] = { name: dealerName, count: 0 };
      }
      acc[dealerId].count += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Analytics</p>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Company → Distributor Invoices (Last 30 Days)</p>
          {companyToDistributor30DaysList.length === 0 ? (
            <p className="text-sm text-gray-500">No invoices in the last 30 days.</p>
          ) : (
            <ul className="space-y-2">
              {companyToDistributor30DaysList.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Company → Distributor Invoices (Last 90 Days)</p>
          {companyToDistributor90DaysList.length === 0 ? (
            <p className="text-sm text-gray-500">No invoices in the last 90 days.</p>
          ) : (
            <ul className="space-y-2">
              {companyToDistributor90DaysList.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Distributor → Dealer Invoices (Last 30 Days)</p>
          {distributorToDealer30DaysList.length === 0 ? (
            <p className="text-sm text-gray-500">No invoices in the last 30 days.</p>
          ) : (
            <ul className="space-y-2">
              {distributorToDealer30DaysList.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Distributor → Dealer Invoices (Last 90 Days)</p>
          {distributorToDealer90DaysList.length === 0 ? (
            <p className="text-sm text-gray-500">No invoices in the last 90 days.</p>
          ) : (
            <ul className="space-y-2">
              {distributorToDealer90DaysList.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <KpiCard label="Top dealers" value={formatNumber(topDealers.length)} icon="👥" />
        <KpiCard label="Top distributors" value={formatNumber(topDistributors.length)} icon="🏢" />
        <KpiCard
          label="Worst distributor"
          value={worstDistributor?.name || "No data"}
          sublabel={worstDistributor?.lastInvoice ? `Last invoice: ${new Date(worstDistributor.lastInvoice).toLocaleDateString()}` : "No invoices yet"}
          icon="⚠️"
        />
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Top dealer performance</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDealers} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="points" fill="#c7a13f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Top distributor performance</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDistributors} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="points" fill="#111" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

