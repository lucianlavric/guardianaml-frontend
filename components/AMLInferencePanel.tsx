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

const VALID_BANK_CODES = [
  "80050F360", "800516110", "80051EDF0", "800520270", "800526450", "800526670", "80052B0F0", "800538930", "80053C4D0", "800548570",
  "8005496A0", "800549A20", "80054B600", "80054BF00", "80054E0F0", "800557E70", "80055F640", "8005645C0", "80056DDC0", "800595080",
  "80059A830", "8005CD2F0", "8005D0050", "8005D01D0", "8005DEFF0", "8005E6950", "8005F5420", "8005F6090", "8005F7120", "8005F8840",
  "8005FC860", "8006080D0", "80061CE60", "800627650", "800631FA0", "800654730", "8006A1D40", "8006AB280", "8006AF230", "8006BA2C0",
  "8006BC530", "8006C15C0", "800717F90", "80071BC20", "800729A40", "80072D850", "800736C10", "800762E00", "800765880", "800771A70",
  "800792870", "8007985A0", "80079AF00", "80079D7F0", "8007F13C0", "8007F1540", "80080ADE0", "800830DD0", "800831E40", "8008340B0",
  "800837760", "80084F050", "80084F2A0", "800873D60", "800884520", "800898150", "8008B3D20", "8008E6360", "8008FF2C0", "800933C00",
  "800935510", "80093F8A0", "80094AC10", "80094ADE0", "80095F600", "8009651A0", "80097AA70", "80097C410", "80097E360", "800984EE0",
  "8009DCB40", "8009DE6E0", "8009EF080", "8009F01C0", "8009F41F0", "8009FAA90", "8009FC590", "800A12C40", "800A21080", "800A22C40",
  "800A33450", "800A33890", "800A3E220", "800A47130", "800A4FF50", "800A544E0", "800A67B70", "800AA9500", "800AC8A90", "800ACD7B0",
  "800ACF610", "800AF1570", "800AFEC10", "800B37200", "800B3E8D0", "800B44D80", "800B48420", "800BC6AE0", "800BCE4E0", "800BD9040",
  "800BDE480", "800BE8180", "800BFCCB0", "800C1DE70", "800C344A0", "800C4D2D0", "800C4E970", "800C53F20", "800C5CCD0", "800C5F950",
  "800C6D310", "800C76660", "800C7E7D0", "800CAFF40", "800CBCF90", "800D03380", "800D06970", "800D15E20", "800D25C20", "800D2D4D0",
  "800D2DED0", "800DA9EC0", "800DCC840", "800DE15A0", "800E0F030", "800E19680", "800E2FFD0", "800E37070", "800E87DB0", "800E92CD0",
  "800E95EA0", "800E99FA0", "800E9D760", "800EBDE60", "800EBE120", "800EBE2F0", "800EFDCD0", "800F0F510", "800F4FB60", "800F65590",
  "800F658F0", "800F6E840", "800F80AD0", "800FDD480", "800FDE880", "800FE6B10", "800FE8C20", "80103E030", "80103E440", "801067390",
];

export default function AMLDashboard() {
  const [activeTab, setActiveTab] = useState('target');
  const [targetBank, setTargetBank] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [transactions, setTransactions] = useState<InferenceResult[]>([]);
  const [riskyAccounts, setRiskyAccounts] = useState<RiskyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const [showBankReference, setShowBankReference] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const fetchTargetAccount = async () => {
    if (!targetBank.trim() || !targetAccount.trim()) {
      setError('Please enter both bank name and account number');
      return;
    }
    if (targetBank.trim().length !== 9 || targetAccount.trim().length !== 9) {
      setError('Bank name and account name must be exactly 9 characters');
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
          account_name: targetAccount,
          only_positive: false
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
    if (targetBank.trim().length !== 9) {
      setError('Bank name must be exactly 9 characters');
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
          top_n: 5,
          only_positive: false
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
                  Bank Name (9 characters)
                </label>
                <input
                  type="text"
                  value={targetBank}
                  onChange={(e) => setTargetBank(e.target.value)}
                  placeholder="e.g., BANKABC01"
                  maxLength={9}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && fetchTargetAccount()}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Examples: BANKABC01, CITYBANK1, FIRSTNB99 • Invalid: ABC (too short), TOOLONGBANK (too long)
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name (9 characters)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={targetAccount}
                    onChange={(e) => setTargetAccount(e.target.value)}
                    placeholder="e.g., ACC123456"
                    maxLength={9}
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
                <p className="mt-1 text-xs text-gray-500">
                  Examples: ACC123456, USER98765, ACCT00001 • Invalid: 123 (too short), ACCOUNT1234 (too long)
                </p>
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
                  Bank Name (9 characters)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={targetBank}
                    onChange={(e) => setTargetBank(e.target.value)}
                    placeholder="e.g., BANKABC01"
                    maxLength={9}
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
                <p className="mt-1 text-xs text-gray-500">
                  Examples: BANKABC01, CITYBANK1, FIRSTNB99 • Invalid: ABC (too short), TOOLONGBANK (too long)
                </p>
              </div>

              {/* Bank Reference Section */}
              <div className="mb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
                <button
                  onClick={() => setShowBankReference(!showBankReference)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  <span>{showBankReference ? '▼' : '▶'}</span>
                  📋 Valid Bank Codes Reference ({VALID_BANK_CODES.length} codes available)
                </button>
                {showBankReference && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-600 mb-3">
                      Click on a bank code to copy it to the input field above:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                      {VALID_BANK_CODES.map((code) => (
                        <button
                          key={code}
                          onClick={() => {
                            setTargetBank(code);
                          }}
                          className="px-3 py-2 bg-white border border-blue-300 rounded text-xs font-mono hover:bg-blue-100 hover:border-blue-500 transition-colors text-blue-700"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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