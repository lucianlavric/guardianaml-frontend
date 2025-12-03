import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Upload, DollarSign } from 'lucide-react';

export default function AMLInferencePanel() {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  // Check Triton health
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/inference');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'error', message: err.message });
    }
  };

  // Handle CSV upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.trim().split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        // Parse CSV rows (skip header)
        const transactions = rows.slice(1).map(row => {
          const values = row.split(',');
          const txn = {};
          headers.forEach((header, i) => {
            txn[header] = values[i]?.trim();
          });
          return txn;
        });
        
        setCsvData(transactions);
        setError(null);
      } catch (err) {
        setError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Run inference on CSV transactions
  const runBatchInference = async () => {
    if (!csvData || csvData.length === 0) {
      setError('Please upload a CSV file first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Format transactions for model (28 features each)
      // NOTE: This is simplified - you need proper feature engineering!
      const formattedData = csvData.slice(0, 100).map(txn => {
        // Extract basic features from CSV
        const amountReceived = parseFloat(txn['Amount Received']) || 0;
        const amountPaid = parseFloat(txn['Amount Paid']) || 0;
        const fxSpread = amountPaid - amountReceived;
        const isCrossCurrency = (txn['Receiving Currency'] !== txn['Payment Currency']) ? 1 : 0;
        const sameBank = (txn['From Bank'] === txn['To Bank']) ? 1 : 0;
        const selfTransfer = (txn['Account'] === txn['To Account']) ? 1 : 0;
        
        // Time features (simplified)
        const timestamp = new Date(txn['Timestamp']);
        const hour = timestamp.getHours();
        const dow = timestamp.getDay();
        const isWeekend = (dow === 0 || dow === 6) ? 1 : 0;
        
        // Aggregate features (would need actual computation from training data)
        // For demo, use zeros - in production, compute these from historical data!
        const accTxCount = 0, accAmtPaidMean = 0, accAmtRecvMean = 0, accCrossCcyRate = 0;
        const toaccTxCount = 0, toaccAmtPaidMean = 0, toaccAmtRecvMean = 0, toaccCrossCcyRate = 0;
        const fbTxCount = 0, fbAmtPaidMean = 0, fbAmtRecvMean = 0, fbCrossCcyRate = 0;
        const tbTxCount = 0, tbAmtPaidMean = 0, tbAmtRecvMean = 0, tbCrossCcyRate = 0;
        
        // Return 28 features in correct order
        return [
          amountReceived, amountPaid, fxSpread,
          isCrossCurrency, sameBank, selfTransfer,
          hour, dow, isWeekend,
          accTxCount, accAmtPaidMean, accAmtRecvMean, accCrossCcyRate,
          toaccTxCount, toaccAmtPaidMean, toaccAmtRecvMean, toaccCrossCcyRate,
          fbTxCount, fbAmtPaidMean, fbAmtRecvMean, fbCrossCcyRate,
          tbTxCount, tbAmtPaidMean, tbAmtRecvMean, tbCrossCcyRate,
          // Categorical features would be one-hot encoded
          0, 0, 0  // Placeholder for encoded categories
        ];
      });

      const response = await fetch('/api/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: [
            {
              name: 'input__0',
              shape: [formattedData.length, 28],
              datatype: 'FP32',
              data: formattedData.flat()
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch inference failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              GuardianAML Detection System
            </h1>
            <p className="text-blue-200">
              Upload IBM synthetic financial transaction data for AML analysis
            </p>
          </div>

          {/* Health Status */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Inference Server Status:</span>
              {health ? (
                <div className="flex items-center gap-2">
                  {health.status === 'ready' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`text-sm ${health.status === 'ready' ? 'text-green-400' : 'text-red-400'}`}>
                    {health.status}
                  </span>
                </div>
              ) : (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Expected CSV Format Info */}
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Expected CSV Format (IBM Synthetic Data)</h3>
            <pre className="text-blue-200 text-xs overflow-x-auto">
{`Timestamp,From Bank,Account,To Bank,To Account,Amount Received,
Receiving Currency,Amount Paid,Payment Currency,Payment Format,Is Laundering

2019/01/01 00:22,800319940,8004ED620,808519790,872ABC810,120.92,
US Dollar,120.92,US Dollar,Credit Card,0`}
            </pre>
          </div>

          {/* CSV Upload */}
          <div className="mb-6 p-6 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
            <label className="flex flex-col items-center cursor-pointer">
              <Upload className="w-12 h-12 text-blue-400 mb-3" />
              <span className="text-white font-medium mb-2">Upload Transaction CSV</span>
              {csvData ? (
                <div className="text-green-400 text-sm mb-2">
                  ✓ {csvData.length} transactions loaded from {csvFile?.name}
                </div>
              ) : (
                <span className="text-blue-300 text-sm mb-2">
                  IBM synthetic AML dataset format
                </span>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-xs text-blue-400 mt-2">Click to browse</span>
            </label>
          </div>

          {/* Feature Engineering Warning */}
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-yellow-400 font-medium">Important Note</div>
                <div className="text-yellow-300 text-sm mt-1">
                  This demo uses simplified feature engineering. Production deployment requires:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Historical aggregate features (tx counts, means, rates per entity)</li>
                    <li>Proper categorical encoding (Payment Format, Currencies)</li>
                    <li>Complete 28-feature vector matching training data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Run Button */}
          {csvData && (
            <button
              onClick={runBatchInference}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Analyze First 100 Transactions
                </>
              )}
            </button>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-medium">Error</div>
                  <div className="text-red-300 text-sm mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 p-6 bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="text-green-400 font-bold text-lg">Batch Analysis Complete</div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              
              {result.prediction && (
                <div className="mb-4">
                  <div className="text-white text-xl font-bold mb-2">
                    Suspicious Transactions Found: {result.prediction.filter(p => p === 1).length}
                  </div>
                  <div className="text-blue-300 text-sm">
                    Total Analyzed: {result.prediction.length}
                  </div>
                </div>
              )}
              
              <details className="mt-4">
                <summary className="text-blue-300 text-sm cursor-pointer hover:text-blue-200">
                  View Raw Model Output
                </summary>
                <pre className="text-green-300 text-xs overflow-x-auto mt-2 p-3 bg-black/30 rounded max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}