import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { login, loginWithPhone } from "../api/api";

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const baseButton =
  "w-full flex items-center justify-between px-5 py-4 border border-gray-200 rounded-2xl text-base font-medium text-gray-800 hover:border-accent-400 hover:text-accent-600 transition-all duration-200";

export default function Login({ setUser, setToken }) {
  const [loginType, setLoginType] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    mobile: "",
    role: ""
  });
  const [status, setStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    if (loginType === "Distributor" || loginType === "Dealer") {
      setFormData((prev) => ({ ...prev, role: loginType }));
    }
  }, [loginType]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const authenticate = async (executor) => {
    setStatus({ loading: true, error: "" });
    try {
      const response = await executor();
      const { user } = response.data;
      setUser(user);
      setToken(response.data.token || "logged-in");
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.msg || "Login failed. Please try again."
      });
      return;
    }
    setStatus({ loading: false, error: "" });
  };

  const handleCompanyLogin = (e) => {
    e.preventDefault();
    authenticate(() => login(formData.username, formData.password));
  };

  const handlePhoneLogin = (e) => {
    e.preventDefault();
    authenticate(() => loginWithPhone(formData.mobile, formData.role));
  };

  const renderShell = (children) => (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f1] via-white to-[#f5efe4] flex items-center justify-center px-4 py-12">
      <motion.div
        variants={cardVariant}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl rounded-[32px] border border-white/60 bg-white/90 shadow-[0_30px_120px_rgba(17,24,39,0.12)] backdrop-blur-xl p-10 space-y-10"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-accent-200 via-accent-400 to-accent-500 flex items-center justify-center text-3xl text-white shadow-lg shadow-accent-200/60 animate-float">
            ✨
          </div>
          <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Star Network Suite</p>
          <h1 className="text-3xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-gray-500">
            Unified access for Company, Distributor and Dealer partners.
          </p>
        </div>
        {children}
      </motion.div>
    </div>
  );

  const renderSelector = () =>
    renderShell(
      <div className="space-y-4">
        {status.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-2xl">
            {status.error}
          </p>
        )}
        <button className={baseButton} onClick={() => setLoginType("Company")}>
          <span className="flex items-center space-x-3">
            <span className="text-2xl">👑</span>
            <span>Company Admin</span>
          </span>
          <span className="text-sm text-gray-400">SSO credentials</span>
        </button>
        <button className={baseButton} onClick={() => setLoginType("Distributor")}>
          <span className="flex items-center space-x-3">
            <span className="text-2xl">🏢</span>
            <span>Distributor</span>
          </span>
          <span className="text-sm text-gray-400">OTP-less phone</span>
        </button>
        <button className={baseButton} onClick={() => setLoginType("Dealer")}>
          <span className="flex items-center space-x-3">
            <span className="text-2xl">🤝</span>
            <span>Dealer</span>
          </span>
          <span className="text-sm text-gray-400">Phone based access</span>
        </button>
      </div>
    );

  const renderCompanyForm = () =>
    renderShell(
      <form className="space-y-6" onSubmit={handleCompanyLogin}>
        <div className="space-y-4">
          <label className="block text-left">
            <span className="text-sm text-gray-500">Username</span>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white/60 px-4 py-3 focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition"
              type="text"
              name="username"
              placeholder="admin@starnetwork"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>
          <label className="block text-left">
            <span className="text-sm text-gray-500">Password</span>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white/60 px-4 py-3 focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        {status.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-2xl">
            {status.error}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setLoginType(null)}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={status.loading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-800/30 hover:brightness-105 transition disabled:opacity-60"
          >
            {status.loading ? "Authenticating..." : "Sign in securely"}
          </button>
        </div>
        <p className="text-xs text-center text-gray-400">Default: admin / admin123</p>
      </form>
    );

  const renderPhoneForm = () =>
    renderShell(
      <form className="space-y-6" onSubmit={handlePhoneLogin}>
        <label className="block text-left">
          <span className="text-sm text-gray-500">Mobile number</span>
          <input
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white/60 px-4 py-3 focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition"
            type="tel"
            name="mobile"
            placeholder="+91 98765 43210"
            value={formData.mobile}
            onChange={handleChange}
            required
          />
        </label>
        {status.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-2xl">
            {status.error}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setLoginType(null)}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={status.loading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-400/50 hover:brightness-105 transition disabled:opacity-60"
          >
            {status.loading ? "Connecting..." : "Continue"}
          </button>
        </div>
      </form>
    );

  if (!loginType) return renderSelector();
  if (loginType === "Company") return renderCompanyForm();
  return renderPhoneForm();
}