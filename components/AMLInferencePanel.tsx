'use client'
import React, { useState } from 'react';
import { Search, AlertTriangle, Building2 } from 'lucide-react';

interface InferenceResult {
  prob: number;
  prediction: boolean;
  bank_name: string;
  account_name: string;
  timestamp: number;
}

interface RiskyAccount {
  bank_name: string;
  account_name: string;
  average_risk_prob: number;
  smoothed_risk: number;
  num_flagged: number;
  num_transactions: number;
}

interface Transaction {
  bank_name?: string;
  from_bank?: string;
  to_bank?: string;
  account_name?: string;
  account?: string;
  timestamp?: string;
  date?: string;
}

export default function AMLDashboard() {
  const [activeTab, setActiveTab] = useState('target');
  const [targetBank, setTargetBank] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [transactions, setTransactions] = useState<InferenceResult[]>([]);
  const [riskyAccounts, setRiskyAccounts] = useState<RiskyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.5);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const fetchTargetAccount = async () => {
    if (!targetBank.trim() || !targetAccount.trim()) {
      setError('Please enter both bank name and account number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/inference/target-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold,
          bank_name: targetBank,
          account_name: targetAccount
        })
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskyAccounts = async () => {
    if (!targetBank.trim()) {
      setError('Please enter a bank name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/inference/bank/top-risky-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold,
          bank_name: targetBank,
          top_n: 5
        })
      });
      if (!response.ok) throw new Error('Failed to fetch risky accounts');
      const data = await response.json();
      setRiskyAccounts(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
      setRiskyAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            GuardianAML Dashboard
          </h1>
          <p className="text-blue-100 mt-2">Anti-Money Laundering Detection System</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('target')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'target'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Search className="w-5 h-5 inline mr-2" />
              Target Account Lookup
            </button>
            <button
              onClick={() => setActiveTab('risky')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'risky'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Top Risky Accounts
            </button>
          </div>

          {/* Target Account Tab */}
          {activeTab === 'target' && (
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={targetBank}
                  onChange={(e) => setTargetBank(e.target.value)}
                  placeholder="Enter bank name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && fetchTargetAccount()}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={targetAccount}
                    onChange={(e) => setTargetAccount(e.target.value)}
                    placeholder="Enter account name..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && fetchTargetAccount()}
                  />
                  <button
                    onClick={fetchTargetAccount}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {loading ? 'Loading...' : 'Search'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {transactions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bank Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Probability
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flagged
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((txn, idx) => (
                        <tr key={idx} className={txn.prediction ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {txn.bank_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {txn.account_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(txn.prob * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-white font-medium ${
                              txn.prediction ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              {txn.prediction ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(txn.timestamp * 1000).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                    Total: {transactions.length} transactions
                  </div>
                </div>
              )}

              {!loading && !error && transactions.length === 0 && targetAccount && (
                <div className="text-center py-12 text-gray-500">
                  No transactions found for this account
                </div>
              )}
            </div>
          )}

          {/* Risky Accounts Tab */}
          {activeTab === 'risky' && (
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={targetBank}
                    onChange={(e) => setTargetBank(e.target.value)}
                    placeholder="Enter bank name..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && fetchRiskyAccounts()}
                  />
                  <button
                    onClick={fetchRiskyAccounts}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {loading ? 'Loading...' : 'Load Top 5 Risky Accounts'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {riskyAccounts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bank Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Risk Probability
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Smoothed Risk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flagged Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {riskyAccounts.map((acc, idx) => (
                        <tr key={idx} className="hover:bg-red-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {acc.bank_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {acc.account_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(acc.average_risk_prob * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(acc.smoothed_risk * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {acc.num_flagged}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {acc.num_transactions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                    Total: {riskyAccounts.length} risky accounts
                  </div>
                </div>
              )}

              {!loading && !error && riskyAccounts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Click the button above to load risky accounts
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}