import React, { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { logout } from "../api/api";

const navConfig = {
  Company: [
    { id: "overview", label: "Overview", path: "/overview", icon: "📊" },
    { id: "distributors", label: "Distributors", path: "/distributors", icon: "🏢" },
    { id: "dealers", label: "Dealers", path: "/dealers", icon: "👥" },
    { id: "products", label: "Products", path: "/products", icon: "📦" },
    { id: "invoices", label: "Invoices", path: "/invoices", icon: "📄" },
    { id: "analytics", label: "Analytics", path: "/analytics", icon: "📈" },
    { id: "content", label: "Content", path: "/content", icon: "📁" },
    { id: "wallets", label: "Wallets", path: "/wallets", icon: "💰" }
  ],
  Distributor: [
    { id: "overview", label: "Overview", path: "/overview", icon: "📊" },
    { id: "my-products", label: "My Products", path: "/my-products", icon: "📦" },
    { id: "upload-dealers", label: "Upload Dealers", path: "/upload-dealers", icon: "📤" },
    { id: "all-products", label: "All Products", path: "/all-products", icon: "🛒" },
    { id: "invoices", label: "Invoices", path: "/invoices", icon: "📄" },
    { id: "wallet", label: "Wallet", path: "/wallet", icon: "💰" },
    { id: "content", label: "SN News", path: "/content", icon: "📁" }
  ],
  Dealer: [
    { id: "overview", label: "Overview", path: "/overview", icon: "📊" },
    { id: "all-products", label: "All Products", path: "/all-products", icon: "📦" },
    { id: "invoices", label: "Invoices", path: "/invoices", icon: "📄" },
    { id: "wallet", label: "Wallet", path: "/wallet", icon: "💰" },
    { id: "content", label: "SN News", path: "/content", icon: "📁" }
  ]
};

const FallbackLinks = [{ id: "overview", label: "Overview", path: "/", icon: "📊" }];

export default function Layout({ children, user, setUser, setToken }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useMemo(() => navConfig[user?.role] || FallbackLinks, [user?.role]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser?.(null);
      setToken?.(null);
    }
  };

  const content = children ?? <Outlet />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white px-5 py-8 lg:flex">
        <div className="mb-10 px-1">
          <p className="text-xs uppercase tracking-[0.5em] text-gray-500">SN Brothers</p>
          <p className="text-2xl font-semibold text-gray-900">Command Hub</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-gradient-to-r from-[#c7a13f]/10 to-[#c7a13f]/5 text-gray-900 shadow-lg shadow-gray-200/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                ].join(" ")
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 pt-8">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Signed in</p>
            <p className="text-sm font-semibold text-gray-900">{user?.name || "—"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-300 bg-white text-gray-900 shadow lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        ☰
      </button>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="w-72 bg-white p-6 shadow-xl">
            <nav className="space-y-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
                    ].join(" ")
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900">
        <main className="flex-1 px-4 py-8 md:px-10">
          <div className="mx-auto max-w-7xl">{content}</div>
        </main>
      </div>
    </div>
  );
}
