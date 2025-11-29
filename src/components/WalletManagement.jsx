import React, { useState, useEffect } from "react";
import { getWalletBalance, getWalletTransactions, getAllWallets, getWalletSummary, companyDeductDistributor } from "../api/api";

export default function WalletManagement() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [allWallets, setAllWallets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');
  const [deductForm, setDeductForm] = useState({ targetId: '', points: '', note: '' });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transactionsRes, walletsRes, summaryRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(),
        getAllWallets(),
        getWalletSummary()
      ]);
      
      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data.transactions);
      setAllWallets(walletsRes.data.wallets);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeduct = async () => {
    try {
      const points = parseInt(deductForm.points);
      if (!deductForm.targetId || !points || points <= 0) return;
      // Only allow deduction for distributors from Company panel
      const targetWallet = allWallets.find(w => w.userID._id === deductForm.targetId);
      const role = targetWallet?.userID?.role;
      if (role !== 'Distributor') {
        alert('Please select a Distributor to deduct points.');
        return;
      }
      await companyDeductDistributor(deductForm.targetId, points, deductForm.note);
      setDeductForm({ targetId: '', points: '', note: '' });
      await loadWalletData();
    } catch (e) {
      console.error('Deduct failed', e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Management</h1>
            <p className="text-gray-600 text-lg">Manage wallet balances and transactions</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{balance}</div>
            <div className="text-sm text-gray-500">Your Balance</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">{summary.totalWallets}</h3>
                <p className="text-sm text-gray-600">Total Wallets</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">⭐</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">{summary.totalPoints}</h3>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">{summary.topWallets?.length}</h3>
                <p className="text-sm text-gray-600">Top Performers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'balance'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">💰</span>
                <span>My Transactions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">👥</span>
                <span>All Wallets</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`py-6 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'top'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏆</span>
                <span>Top Performers</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'balance' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">My Transaction History</h2>
              {transactions?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <div key={transaction._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'Credit' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            <span className="text-lg">
                              {transaction.type === 'Credit' ? '⬆️' : '⬇️'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {transaction.type} Transaction
                            </h3>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()} {transaction.note ? '• ' + transaction.note : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'Credit' ? '+' : '-'}{transaction.points.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">All Wallets</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="grid md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-xs text-gray-600">Target User</label>
                    <select className="mt-1 w-full border-gray-300 rounded-lg" value={deductForm.targetId} onChange={e => setDeductForm({ ...deductForm, targetId: e.target.value })}>
                      <option value="">Select distributor</option>
                      {allWallets.filter(w => w.userID.role === 'Distributor').map(w => (
                        <option key={w.userID._id} value={w.userID._id}>{w.userID.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Points</label>
                    <input type="number" className="mt-1 w-full border-gray-300 rounded-lg" value={deductForm.points} onChange={e => setDeductForm({ ...deductForm, points: e.target.value })} min="1" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs text-gray-600">Note</label>
                    <input type="text" className="mt-1 w-full border-gray-300 rounded-lg" value={deductForm.note} onChange={e => setDeductForm({ ...deductForm, note: e.target.value })} placeholder="Reason (optional)" />
                  </div>
                  <div>
                    <button onClick={handleDeduct} className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700">Deduct</button>
                  </div>
                </div>
                <p className="text-xs text-yellow-700 mt-2">Company can deduct from Distributors;</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allWallets.map(wallet => (
                  <div key={wallet._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {wallet.userID.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{wallet.userID.name}</h3>
                        <p className="text-xs text-gray-500">{wallet.userID.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {wallet.balancePoints}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'top' && summary && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Top Performers</h2>
              <div className="space-y-4">
                {summary.topWallets.map((wallet, index) => (
                  <div key={wallet._id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{wallet.userID.name}</h3>
                          <p className="text-xs text-gray-500">{wallet.userID.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">
                          {wallet.balancePoints}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
