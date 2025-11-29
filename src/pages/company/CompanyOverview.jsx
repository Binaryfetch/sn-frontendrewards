import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDistributors, getAllDealers, getAllProductsAdmin, getUserInvoices, getAllWallets } from "../../api/api";
import KpiCard from "../../components/ui/KpiCard";
import { formatNumber } from "../../utils/formatters";

export default function CompanyOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    distributors: 0,
    dealers: 0,
    products: 0,
    companyPoints: 0
  });
  const [distributorPoints, setDistributorPoints] = useState([]);
  const [dealerPoints, setDealerPoints] = useState([]);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      try {
        const [distRes, dealerRes, productRes, invoiceRes, walletsRes] = await Promise.all([
          getDistributors(),
          getAllDealers(),
          getAllProductsAdmin(),
          getUserInvoices(),
          getAllWallets()
        ]);

        const invoices = invoiceRes.data.invoices || [];
        const companyPoints = invoices
          .filter((invoice) => invoice.createdByRole === "Company")
          .reduce((sum, invoice) => sum + Number(invoice.totalReward || 0), 0);

        // Get wallet balances for distributors and dealers
        const wallets = walletsRes.data.wallets || [];
        const distributorWallets = wallets
          .filter((w) => w.user?.role === "Distributor")
          .map((w) => ({
            name: w.user?.name || "—",
            bpCode: w.user?.bpCode || "—",
            points: w.balance || 0
          }))
          .sort((a, b) => b.points - a.points);

        const dealerWallets = wallets
          .filter((w) => w.user?.role === "Dealer")
          .map((w) => ({
            name: w.user?.name || "—",
            distributor: w.user?.distributorID?.name || "—",
            points: w.balance || 0
          }))
          .sort((a, b) => b.points - a.points);

        setStats({
          distributors: distRes.data.distributors?.length || 0,
          dealers: dealerRes.data.dealers?.length || 0,
          products: productRes.data.products?.length || 0,
          companyPoints
        });
        setDistributorPoints(distributorWallets);
        setDealerPoints(dealerWallets);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.msg || "Failed to load overview");
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Overview</p>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total distributors" value={formatNumber(stats.distributors)} icon="🏢" />
        <KpiCard label="Total dealers" value={formatNumber(stats.dealers)} icon="👥" />
        <KpiCard label="Total products" value={formatNumber(stats.products)} icon="📦" />
        <KpiCard label="Points issued" value={`${formatNumber(stats.companyPoints)} pts`} icon="⭐" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Distributor Points</p>
          {distributorPoints.length === 0 ? (
            <p className="text-sm text-gray-500">No distributors with points yet.</p>
          ) : (
            <ul className="space-y-2">
              {distributorPoints.map((dist, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{dist.name}</p>
                    <p className="text-xs text-gray-500">BP: {dist.bpCode}</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatNumber(dist.points)} pts</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Dealer Points</p>
          {dealerPoints.length === 0 ? (
            <p className="text-sm text-gray-500">No dealers with points yet.</p>
          ) : (
            <ul className="space-y-2">
              {dealerPoints.map((dealer, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{dealer.name}</p>
                    <p className="text-xs text-gray-500">Distributor: {dealer.distributor}</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatNumber(dealer.points)} pts</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

