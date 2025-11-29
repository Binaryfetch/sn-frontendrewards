import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDealers, getWalletBalance, getMyProductAllocations } from "../../api/api";
import { formatNumber } from "../../utils/formatters";

const goldAccent = "text-[#f5c66f]";

export default function DistributorOverview() {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadSnapshot = async () => {
      setLoading(true);
      try {
        const [walletRes, dealersRes, productRes] = await Promise.all([
          getWalletBalance(),
          getDealers(),
          getMyProductAllocations()
        ]);

        setWalletBalance(walletRes.data?.balance || 0);
        setDealers(dealersRes.data?.dealers || []);
        setProducts(productRes.data?.products || []);
      } catch (error) {
        console.error("Distributor overview load failed:", error);
        toast.error(error?.response?.data?.msg || "Unable to load overview right now.");
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, []);

  const featuredDealers = dealers.slice(0, 4);
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="space-y-10">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white p-10 shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Distributor</p>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900">Command your network</h1>
            <p className="mt-3 text-sm text-gray-600">
              Real-time clarity on wallet health, dealer reach, and the allocations that keep your region moving.
            </p>
          </div>
          <div className="rounded-3xl border border-[#c7a13f]/30 bg-gray-50 px-8 py-6 text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">My dealers</p>
            <p className="mt-2 text-5xl font-semibold text-gray-900">{formatNumber(dealers.length)}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <SummaryCard
          loading={loading}
          title="Your wallet points"
          value={`${formatNumber(walletBalance)} pts`}
          subtitle="Liquid reward power you can push to dealers instantly."
          icon="💰"
        />
        <SummaryCard
          loading={loading}
          title="Active dealer partners"
          value={`${formatNumber(dealers.length)} dealers`}
          subtitle="Stay in sync with your top performing partners."
          icon="👥"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Dealer pulse</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">My Dealers</h2>
              <p className="mt-1 text-sm text-gray-600">Quick snapshot of the partners you interact with most.</p>
            </div>
            <span className="text-3xl text-[#c7a13f]">✦</span>
          </div>

          {loading ? (
            <SkeletonList />
          ) : featuredDealers.length === 0 ? (
            <EmptyState message="Dealers will appear as soon as they are onboarded." />
          ) : (
            <div className="mt-6 space-y-4">
              {featuredDealers.map((dealer) => (
                <article
                  key={dealer._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-medium text-gray-900">{dealer.name || "Dealer"}</p>
                      <p className="text-sm text-gray-600">{dealer.address || dealer.businessType || "—"}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{dealer.mobile || "N/A"}</p>
                      {dealer.email && <p>{dealer.email}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Allocation radar</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Primary SKUs</h2>
              <p className="mt-1 text-sm text-gray-600">Last received allocations and their current balance.</p>
            </div>
            <span className="text-3xl text-[#c7a13f]">📦</span>
          </div>

          {loading ? (
            <SkeletonList />
          ) : featuredProducts.length === 0 ? (
            <EmptyState message="No allocated products yet. Invoices from HQ will populate this view." />
          ) : (
            <div className="mt-6 space-y-4">
              {featuredProducts.map((product) => (
                <article
                  key={product._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {product.itemDescription || product.name || "Product"}
                      </p>
                      <p className="text-xs tracking-widest text-gray-500">{product.itemNo || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatNumber(product?.allocation?.qty || 0)}
                      </p>
                      <p className="text-xs text-gray-500">{product?.allocation?.uom || "Units"} available</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ loading, title, value, subtitle, icon }) {
  if (loading) {
    return (
      <div className="h-40 rounded-[28px] border border-gray-200 bg-white animate-pulse" />
    );
  }

  return (
    <section className="rounded-[28px] border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">{title}</p>
          <p className="mt-4 text-4xl font-semibold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-2xl">
          {icon}
        </div>
      </div>
    </section>
  );
}

const SkeletonList = () => (
  <div className="mt-6 space-y-4">
    {[0, 1, 2].map((key) => (
      <div key={key} className="h-16 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
    ))}
  </div>
);

function EmptyState({ message }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}


