import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpRight,
  TrendingDown,
  Building2,
  Receipt,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  ArrowDownToLine,
  ChevronRight,
  Layers,
  Coins,
  History,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentTab }) => {
  const { userProfile } = useAuth();
  const { wallet, transactions, conversionRateUsdtInr } = useWallet();

  const [copiedId, setCopiedId] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyUserId = () => {
    if (!userProfile?.userIdCode) return;
    navigator.clipboard.writeText(userProfile.userIdCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const referralUrl = `${window.location.origin}/?ref=${userProfile?.referralCode || 'PRO'}`;
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const inrBal = wallet?.inrBalance || 0;
  const usdtBal = wallet?.usdtBalance || 0;
  const usdtBepBal = wallet?.usdtBep20Balance || 0;
  const totalUsdt = usdtBal + usdtBepBal;
  const totalPortfolioInr = inrBal + totalUsdt * conversionRateUsdtInr;

  const levelIncome = wallet?.levelIncome || 0;
  const ltdIncome = wallet?.ltdIncome || 0;
  const totalIncome = wallet?.totalIncome || 0;

  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Profile & User ID Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-extrabold text-lg shadow-xs">
            {userProfile?.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{userProfile?.displayName || 'Trader'}</h2>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{userProfile?.email}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-700">{userProfile?.userIdCode || 'USR-000000'}</span>
            </div>
          </div>
        </div>

        {/* User ID & 2FA Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyUserId}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId ? 'Copied' : 'Copy User ID'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className={`w-2 h-2 rounded-full ${userProfile?.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span>2FA {userProfile?.twoFactorEnabled ? 'Active' : 'Disabled'}</span>
          </div>
        </div>
      </div>

      {/* 2. Wallet Balances Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INR Balance Hero Card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="w-4 h-4 text-cyan-400" /> INR Wallet Balance
              </span>
              <span className="text-cyan-300 font-mono text-[11px] font-semibold">Primary Balance</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight font-mono text-white tabular-nums">
                ₹{inrBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Available for instant bank settlement & sell proceeds</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Portfolio Value</span>
            <span className="font-bold text-cyan-300 font-mono tabular-nums text-sm">
              ₹{totalPortfolioInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* USDT TRC20 Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Coins className="w-4 h-4 text-amber-500" /> USDT Balance (TRC20)
              </span>
              <span className="text-[11px] font-semibold text-amber-700">TRON Network</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight font-mono text-slate-900 tabular-nums">
                {usdtBal.toFixed(2)} <span className="text-sm font-semibold text-slate-400 font-sans">USDT</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                ≈ ₹{(usdtBal * conversionRateUsdtInr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rate: ₹{conversionRateUsdtInr.toFixed(2)}</span>
            <button
              onClick={() => setCurrentTab('deposit')}
              className="text-cyan-700 font-bold hover:underline flex items-center gap-1"
            >
              Deposit <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* USDT BEP20 Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Layers className="w-4 h-4 text-sky-500" /> USDT Balance (BEP20)
              </span>
              <span className="text-[11px] font-semibold text-sky-700">BNB Smart Chain</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight font-mono text-slate-900 tabular-nums">
                {usdtBepBal.toFixed(2)} <span className="text-sm font-semibold text-slate-400 font-sans">USDT</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                ≈ ₹{(usdtBepBal * conversionRateUsdtInr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Lower Gas Network</span>
            <button
              onClick={() => setCurrentTab('transfer')}
              className="text-cyan-700 font-bold hover:underline flex items-center gap-1"
            >
              Transfer <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Buttons Bar */}
      {/* Requirement: Blue/cyan primary buttons, Yellow/orange Deposit button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Deposit Button: Distinct Yellow / Orange as per section 20 */}
          <button
            onClick={() => setCurrentTab('deposit')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xs">Deposit</span>
            <span className="text-[10px] text-amber-100">USDT / INR</span>
          </button>

          {/* Transfer Button: Cyan / Blue */}
          <button
            onClick={() => setCurrentTab('transfer')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xs">Transfer</span>
            <span className="text-[10px] text-cyan-100">Send USDT</span>
          </button>

          {/* Sell Button: Sky / Blue */}
          <button
            onClick={() => setCurrentTab('sell')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xs">Sell USDT</span>
            <span className="text-[10px] text-sky-100">Instant INR</span>
          </button>

          {/* Withdrawal Button: Royal Blue */}
          <button
            onClick={() => setCurrentTab('withdrawals')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <ArrowDownToLine className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xs">Withdrawal</span>
            <span className="text-[10px] text-blue-100">INR to Bank</span>
          </button>

          {/* Bank Accounts Button: Slate */}
          <button
            onClick={() => setCurrentTab('bank-accounts')}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xs">Bank Transfer</span>
            <span className="text-[10px] text-slate-300">Bank Accounts</span>
          </button>
        </div>
      </div>

      {/* 4. Income Section (Level, LTD, Total Income) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Income & Referral Distribution</h3>
            <p className="text-xs text-slate-500">Real-time breakdown of affiliate rewards and ledger allocations</p>
          </div>
          <button
            onClick={() => setCurrentTab('income')}
            className="text-xs font-semibold text-cyan-700 hover:underline flex items-center gap-1"
          >
            Details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Level Income */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Level Income
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹{levelIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Multi-tier affiliate commission (Levels 1, 2, 3)</p>
          </div>

          {/* LTD Income */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              LTD Income
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹{ltdIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Long-term distribution & staking rewards</p>
          </div>

          {/* Total Income */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Income
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cumulative verified platform earnings</p>
          </div>
        </div>
      </div>

      {/* 5. Referral Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider block">
            Referral Program · 9% + 7% + 5%
          </span>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">Invite Traders & Earn Lifetime Commissions</h4>
          <p className="text-xs text-slate-500 max-w-lg mt-0.5">
            Share your unique referral link. Commissions are credited to your Level Income ledger upon verified deposits.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono tabular-nums text-xs text-slate-800 truncate max-w-xs">
            {referralUrl}
          </div>
          <button
            onClick={handleCopyReferral}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
          >
            {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedRef ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* 6. Recent Transactions Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Ledger Activity</h3>
            <p className="text-xs text-slate-500">Verified transactions recorded in the append-only database ledger</p>
          </div>
          <button
            onClick={() => setCurrentTab('transactions')}
            className="text-xs font-semibold text-cyan-700 hover:underline flex items-center gap-1"
          >
            View All ({transactions.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No transactions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Make a deposit or transfer to see ledger entries here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">Reference ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${tx.type === 'Deposit' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                        <span>{tx.type}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono tabular-nums text-slate-600">{tx.referenceId}</td>
                    <td className="py-3 font-bold font-mono tabular-nums text-slate-900">
                      {tx.currency} {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tx.status === 'Completed' ? 'bg-emerald-500' : tx.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span className={tx.status === 'Completed' ? 'text-emerald-700' : tx.status === 'Pending' ? 'text-amber-700' : 'text-slate-600'}>
                          {tx.status}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right text-slate-400 font-mono tabular-nums">
                      {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
