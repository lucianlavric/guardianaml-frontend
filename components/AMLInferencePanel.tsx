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

const TARGET_ACCOUNT_LOOKUP: Record<string, string[]> = {
  "80094AC10": ["8011A44B0"],
  "80094ADE0": ["800C99F00"],
  "80095F600": ["80095F5B0", "8014E04B0"],
  "8009651A0": ["80125B580"],
  "80097AA70": ["80097AA20"],
  "80097C410": ["80097C3C0"],
  "80097E360": ["800983AC0", "80098D190", "80098E530", "800991870", "800999750", "8009EDA40", "8009F6B70", "800A09190", "800A0CE40", "800A1FAC0", "800A29B70", "800A2CE10", "800A3F550", "800A55350", "800A58D10", "800A5D700", "800A677C0", "800A6B850", "800AA87B0", "800ABE7C0", "800ABF120", "800AF79A0", "800B00EB0", "800B2C8F0", "800B47A40", "800B5A2F0", "800BC86E0", "800BD2CC0", "800BE4880", "800C07B50", "800C20440", "800C26E00", "800C35B20", "800C4D230", "800C69B90", "800C6B3E0", "800C6CB40", "800C99CE0", "800CA0D40", "800CB16F0", "800CB2EC0", "800CDC820", "800CFF440", "800D1B9F0", "800D252F0", "800D29AD0", "800E2D7D0", "800E31790", "800E31990", "800E98630", "800EB1750", "800EEB170", "800EEDD10", "800EF3F40", "800EF52F0", "800EFEAA0", "800F0FA50", "800F1E710", "800F5C3A0", "800F6BAB0", "800F731D0", "800FF0D60", "801040BC0", "80104D530", "80104E690", "8010778E0", "8010A3CF0", "8010ACCF0", "8010BBCE0", "8010F0F10", "80116FAB0", "8011A5F60", "8011E7AE0", "801208FA0", "801214110", "80125ED20", "8012C47B0", "8012C5590", "8012D06C0", "8012ECA10", "8012ECBF0", "8012EE0D0", "8012F7C00", "8014449E0", "801446250", "80145C0D0", "8014744A0", "8014F2D50", "80155ED30", "8015BDF80", "808422650", "80A14D4C0", "8126FD580", "822476D50"],
  "800984EE0": ["800984E90"],
  "8009DCB40": ["800BCBB80"],
  "8009DE6E0": ["8009ED1C0", "8009FD8B0", "800A07710", "800A13F50", "800A1FCF0", "800A22BA0", "800A270B0", "800A5AF10", "800A66A20", "800AA8940", "800B013B0", "800B0B3D0", "800B0B7A0", "800B1BB70", "800B44C90", "800B6BCE0", "800BCCD40", "800BD0250", "800BD31A0", "800BD4C40", "800BE84A0", "800C0A720", "800C201C0", "800C48150", "800C4EBF0", "800C68FD0", "800C73640", "800C75030", "800C957D0", "800CB8EE0", "800CD83F0", "800CDA100", "800D2FD50", "800D2FFE0", "800DACAE0", "800DACEF0", "800DEF700", "800E06070", "800E0A410", "800E0B040", "800E1EF10", "800E2A6C0", "800E51BA0", "800E81C40", "800E98C20", "800F12220", "800F172F0", "800F25F50", "800F289D0", "800F2D0A0", "800F60220", "800FDF530", "800FFFF30", "801039DE0", "80103DF40", "80104D620", "801066DA0", "8010A1E40", "8010C1CF0", "8010FC0A0", "801116B00", "801202B70", "801207AE0", "80124AA80", "801254450", "8012AAB40", "8012BC8F0", "8012F3A70", "80130AA70", "801371760", "8013E6550", "8014355F0", "801473A10", "801498230", "8015131C0", "801518F60", "80151AEC0", "80151CC50", "801525200", "8015681D0", "80158BE70", "802357850", "8044039D0", "80476C9F0", "80B53CC10", "81111E9D0", "81AE02800"],
  "8009EF080": ["8009EF030"],
  "8009F01C0": ["80153CFA0"],
  "8009F41F0": ["800B6AEE0"],
  "8009FAA90": ["81F45F070"],
  "8009FC590": ["8009FC540"],
  "800A12C40": ["800BD4BF0"],
  "800A21080": ["800A21030"],
  "800A22C40": ["8004CD680", "800894BA0", "800A28860", "800A2BD10", "800A2C2F0", "800A2FAA0", "800A37790", "800A553A0", "800A61450", "800AA5BE0", "800ADD6A0", "800AF2440", "800AF7DB0", "800B14F40", "800B1E920", "800B2D150", "800B49CB0", "800BD0DC0", "800BE4920", "800BE79C0", "800BE8A70", "800C18E10", "800C3D4D0", "800C46CC0", "800C55AA0", "800C5A250", "800C5DF80", "800C80300", "800CB3780", "800D0F3E0", "800D18B10", "800D1D0A0", "800DAA1D0", "800DDB040", "800DE3000", "800DFEC50", "800DFEFE0", "800E09FD0", "800E403B0", "800E7C0A0", "800E8F970", "800E9CCB0", "800EE0640", "800EE41D0", "800EE6EB0", "800F08A70", "800F29EE0", "800F3E3E0", "800F80850", "800FC63C0", "800FFE370", "801000420", "801035E40", "8010B4010", "8010D0230", "8011729F0", "8011A28D0", "8011E3C00", "8011ED0E0", "8011FFF00", "801207410", "801208C80", "8012306F0", "80125AAC0", "80128DF40", "8012AB290", "8012C2730", "801491250", "8014941A0", "8014D17E0", "8014D5F50", "8015047A0", "801522D80", "80156E7C0", "80158ED70", "8015A5C80", "8015C24E0", "8015C6B50", "8015C6CE0", "8015C8140", "8015EFFC0", "8015FD480", "802341140", "8070D15D0", "80E7AFD10", "81D1A5A10", "81DEDA5C0"],
  "800A33450": ["800C721A0"],
  "800A33890": ["800B1CF30"],
  "800A3E220": ["80147A4E0"],
  "800A47130": ["80124B950"],
  "800A4FF50": ["80145BEB0"],
  "800A544E0": ["8014CDCF0"],
  "800A67B70": ["800A9F710", "800AB4520", "800AB5280", "800AC99E0", "800ACF3E0", "800AF1E70", "800B14E00", "800B2F5F0", "800B30D00", "800B3D930", "800BD1000", "800BD9310", "800BE6CA0", "800C4D960", "800C6C4B0", "800C6F6C0", "800C8E400", "800C944C0", "800C9A300", "800CB9E20", "800CEF470", "800D107D0", "800D26210", "800D352D0", "800DE49C0", "800DEFB70", "800E08440", "800EE0F40", "800EE7400", "800EF0700", "800F11B50", "800F21F50", "800F28150", "800F31540", "800F5B950", "800F60960", "800FB1AE0", "800FED100", "8010AF660", "8010FC230", "80110F420", "801167DC0", "8011E44A0", "801230790", "801417030", "80144CEA0", "8014CDD40", "801500A30", "801501730", "80153ABD0", "80157BA20", "80158AF70", "80159C660", "8015BCE90", "8015DAE10", "8015FE6F0", "8015FF660", "8023423B0", "83119BD30"],
  "800AA9500": ["8014957F0"],
  "800AC8A90": ["8015C2AB0"],
  "800ACD7B0": ["800DC3850"],
  "800ACF610": ["800ACF5C0", "801296F10"],
  "800AF1570": ["801498F60"],
  "800AFEC10": ["800DC7250"],
  "800B37200": ["800771EE0", "801464650"],
  "800B3E8D0": ["800B3E880"],
  "800B44D80": ["800B6B160", "800BA7C00", "800BC7AA0", "800C05A20", "800C0ACF0", "800C0C2D0", "800C18600", "800C1B590", "800C1BF00", "800C1FA70", "800C23EF0", "800C2AE20", "800C4C910", "800C57170", "800C950E0", "800C9A3A0", "800C9B630", "800CB9E70", "800D140D0", "800D16140", "800D1D330", "800D29890", "800D34FC0", "800D354C0", "800DC6670", "800DEAF80", "800E0AEB0", "800E1EE00", "800E37ED0", "800E410F0", "800E4B080", "800E7AEC0", "800EFCCF0", "800F21290", "800F2EE80", "800F7E270", "800FE92C0", "800FEEFC0", "8010414D0", "801075D60", "801080BD0", "80108DB30", "8010AE150", "8010F7EF0", "8010FCDA0", "801169DE0", "8011E8B80", "8011FC0C0", "8011FC1B0", "801250C90", "8012D1A40", "8012D2D10", "8012D4190", "80131EE20", "801498630", "80149C060", "801502F60", "80150FAB0", "801521AC0", "80155F710", "80159CBC0", "8015C8B90", "8015DB340", "8015E1920", "806EAB890", "8083FB8A0", "80A790A50", "811FE7BA0", "82838E710"],
  "800B48420": ["800C2A160"],
  "800BC6AE0": ["800BBFB50"],
  "800BCE4E0": ["800BCE490", "800BCF150"],
  "800BD9040": ["800BD8FF0"],
  "800BDE480": ["8008977C0", "8008D1180", "800C193A0", "800C569B0", "800C59790", "800C62FD0", "800C63B80", "800C66EF0", "800C71AD0", "800C75470", "800C91140", "800C92690", "800CB12B0", "800CB4CF0", "800CDA060", "800D0F340", "800D2A5B0", "800D2E4F0", "800DCE050", "800E2F670", "800E7BCA0", "800E806E0", "800EF3EA0", "800F1E760", "800F5BC60", "800F6CC00", "800FC2260", "8010738C0", "8010ACE30", "8011175B0", "80114B990", "8011A11F0", "8011E4230", "8011F5B80", "801202F80", "80120F310", "80122A990", "80122D040", "801250CE0", "80125F7A0", "8012ECF60", "80130C3D0", "8013718A0", "801445310", "80146D430", "8014CE440", "8014DC6B0", "8014E1540", "801524290", "80153CBA0", "80157D5F0", "80159A310", "80159D550", "802356DF0", "8026D73C0", "8066193C0", "80A722BA0", "80A789EA0", "81B59B120"],
  "800BE8180": ["800BE8130"],
  "800BFCCB0": ["800894E10", "800C07C40", "800C1FC80", "800C216B0", "800C56430", "800C59010", "800C76030", "800C76080", "800C7ED70", "800CA0FB0", "800CA1E20", "800D09360", "800D2C6C0", "800D30B50", "800DAA040", "800DD0950", "800DF2760", "800E045D0", "800E07670", "800E186D0", "800E1B0C0", "800E88550", "800E9BC00", "800F12C30", "800F505E0", "800F5F070", "800F5FCB0", "800F6BA60", "800F6D510", "800FE31D0", "800FEB4B0", "800FEE530", "800FF4F80", "801024910", "801025030", "80104B300", "80108EE10", "801099AB0", "8010BC740", "8010EF390", "8011F5C20", "8012CFA50", "8012D22D0", "801464560", "8014722F0", "801476F60", "80147C320", "8014D47F0", "8014D7790", "8014DA6C0", "8014DB230", "80155F140", "801569620", "80158ABA0", "8015AD160", "8015C1CE0", "8015C48D0", "8029DA5A0", "8055C7B10", "80933B470", "81B5D9880", "81D7FDF20"],
  "800C1DE70": ["800C1DE20"],
  "800C344A0": ["800E4C650"],
  "800C4D2D0": ["8012328F0"],
  "800C4E970": ["80089A9B0", "800C56390", "800C621C0", "800C6D270", "800C71D90", "800C76430", "800CB3690", "800D0EF80", "800D13E90", "800D1B5A0", "800D2E2B0", "800D2F5C0", "800DD7890", "800DE69E0", "800E24AE0", "800E29810", "800E52680", "800E86FE0", "800E8FBE0", "800F138A0", "800F314A0", "800F32660", "800FF40C0", "800FFFBC0", "80100AD60", "80100DE90", "80108C600", "8010B8700", "8010EF910", "8011F54A0", "801206700", "8012154B0", "80122B760", "8012322A0", "80125ACB0", "80125EE10", "8012ABA20", "8012BBA00", "8012BE2B0", "8012F07D0", "8012F45C0", "8013C9AA0", "801437200", "80147F000", "8014D74D0", "8014E1760", "801506430", "80151C3A0", "80151D1C0", "801522FC0", "8015C1490", "8015DCDB0", "8053509C0"],
};


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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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

              {/* Target Account Reference Section */}
              <div className="mb-6 border border-green-200 rounded-lg p-4 bg-green-50">
                <button
                  onClick={() => setShowBankReference(!showBankReference)}
                  className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-900"
                >
                  <span>{showBankReference ? '▼' : '▶'}</span>
                  📋 Target Account Lookup Reference ({Object.keys(TARGET_ACCOUNT_LOOKUP).length} bank codes available)
                </button>
                {showBankReference && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-600 mb-3">
                      Click on a bank code to populate the Bank Name field and view linked accounts:
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {Object.entries(TARGET_ACCOUNT_LOOKUP).map(([bankCode, accounts]) => (
                        <div key={bankCode} className="border border-green-300 rounded p-2 bg-white">
                          <button
                            onClick={() => setTargetBank(bankCode)}
                            className="w-full text-left px-3 py-2 font-mono text-sm font-medium hover:bg-green-100 rounded transition-colors text-green-700 flex justify-between items-center"
                          >
                            <span>{bankCode}</span>
                            <span className="text-xs text-gray-500 font-normal">({accounts.length} accounts)</span>
                          </button>
                          <div className="px-3 py-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                            {accounts.map((account) => (
                              <button
                                key={account}
                                onClick={() => {
                                  setTargetBank(bankCode);
                                  setTargetAccount(account);
                                }}
                                className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-mono hover:bg-green-50 hover:border-green-500 transition-colors text-gray-700"
                              >
                                {account}
                              </button>
                            ))}
                          </div>
                        </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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