import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { login, loginWithPhone } from "../api/api";

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const buttonVariant = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        variants={cardVariant}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/5 p-8 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-[#c7a13f] via-[#d4b15a] to-[#c7a13f] flex items-center justify-center text-3xl text-white shadow-lg shadow-[#c7a13f]/30">
            ✨
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500 font-medium">S.N BROTHERS</p>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Unified access for Company, Distributor and Dealer partners.
            </p>
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  );

  const renderSelector = () =>
    renderShell(
      <div className="space-y-3">
        {status.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl"
          >
            {status.error}
          </motion.div>
        )}
        <motion.button
          variants={buttonVariant}
          whileHover="hover"
          whileTap="tap"
          className="w-full flex items-center justify-between px-5 py-4 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-800 hover:border-[#c7a13f] hover:bg-[#c7a13f]/5 transition-all duration-200 group"
          onClick={() => setLoginType("Company")}
        >
          <span className="flex items-center space-x-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
            <span>Company Admin</span>
          </span>
          <span className="text-sm text-gray-500 group-hover:text-[#c7a13f] transition-colors">SSO credentials</span>
        </motion.button>
        <motion.button
          variants={buttonVariant}
          whileHover="hover"
          whileTap="tap"
          className="w-full flex items-center justify-between px-5 py-4 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-800 hover:border-[#c7a13f] hover:bg-[#c7a13f]/5 transition-all duration-200 group"
          onClick={() => setLoginType("Distributor")}
        >
          <span className="flex items-center space-x-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">🏢</span>
            <span>Distributor</span>
          </span>
          <span className="text-sm text-gray-500 group-hover:text-[#c7a13f] transition-colors">OTP-less phone</span>
        </motion.button>
        <motion.button
          variants={buttonVariant}
          whileHover="hover"
          whileTap="tap"
          className="w-full flex items-center justify-between px-5 py-4 border-2 border-gray-200 rounded-2xl text-base font-semibold text-gray-800 hover:border-[#c7a13f] hover:bg-[#c7a13f]/5 transition-all duration-200 group"
          onClick={() => setLoginType("Dealer")}
        >
          <span className="flex items-center space-x-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">🤝</span>
            <span>Dealer</span>
          </span>
          <span className="text-sm text-gray-500 group-hover:text-[#c7a13f] transition-colors">Phone based access</span>
        </motion.button>
      </div>
    );

  const renderCompanyForm = () =>
    renderShell(
      <form className="space-y-6" onSubmit={handleCompanyLogin}>
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">Username</span>
            <input
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f] transition-all"
              type="text"
              name="username"
              placeholder="admin@starnetwork"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">Password</span>
            <input
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f] transition-all"
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl"
          >
            {status.error}
          </motion.div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            variants={buttonVariant}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={() => setLoginType(null)}
            className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </motion.button>
          <motion.button
            variants={buttonVariant}
            whileHover="hover"
            whileTap="tap"
            type="submit"
            disabled={status.loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#c7a13f] to-[#d4b15a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#c7a13f]/30 hover:shadow-[#c7a13f]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status.loading ? "Authenticating..." : "Sign in securely"}
          </motion.button>
        </div>
        <p className="text-xs text-center text-gray-500">Default: admin / admin123</p>
      </form>
    );

  const renderPhoneForm = () =>
    renderShell(
      <form className="space-y-6" onSubmit={handlePhoneLogin}>
        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">Mobile number</span>
          <input
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#c7a13f]/20 focus:border-[#c7a13f] transition-all"
            type="tel"
            name="mobile"
            placeholder="+91 98765 43210"
            value={formData.mobile}
            onChange={handleChange}
            required
          />
        </label>
        {status.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl"
          >
            {status.error}
          </motion.div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            variants={buttonVariant}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={() => setLoginType(null)}
            className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </motion.button>
          <motion.button
            variants={buttonVariant}
            whileHover="hover"
            whileTap="tap"
            type="submit"
            disabled={status.loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#c7a13f] to-[#d4b15a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#c7a13f]/30 hover:shadow-[#c7a13f]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status.loading ? "Connecting..." : "Continue"}
          </motion.button>
        </div>
      </form>
    );

  if (!loginType) return renderSelector();
  if (loginType === "Company") return renderCompanyForm();
  return renderPhoneForm();
}
