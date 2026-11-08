import React from 'react';
import {
  PieChart,
  TrendingUp,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Coins,
  Wallet,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';

interface IncomeScreenProps {
  setCurrentTab: (tab: string) => void;
}

export const IncomeScreen: React.FC<IncomeScreenProps> = ({ setCurrentTab }) => {
  const { wallet, ledgerEntries } = useWallet();

  const levelIncome = wallet?.levelIncome || 0;
  const ltdIncome = wallet?.ltdIncome || 0;
  const totalIncome = wallet?.totalIncome || (levelIncome + ltdIncome);

  const incomeLedger = ledgerEntries.filter(
    (l) => l.type === 'credit' && (l.source.includes('INCOME') || l.source.includes('REFERRAL'))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
          Income & Yield Distribution
        </h2>
        <p className="text-xs text-slate-500">Live analytics of all affiliate level bonuses and long-term distributions</p>
      </div>

      {/* Main Income Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level Income Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-600" /> Level Income
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold">
              Affiliate Pool
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              ₹{levelIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Generated across Level 1, 2, and 3 affiliate networks</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Direct + Sub-tiers</span>
            <button
              onClick={() => setCurrentTab('referrals')}
              className="text-cyan-600 font-bold hover:underline"
            >
              Network View →
            </button>
          </div>
        </div>

        {/* LTD Income Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> LTD Income
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              Long-Term Dist.
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              ₹{ltdIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Platform liquidity sharing & staking allocations</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated Daily Credit</span>
            <span className="text-emerald-600 font-bold">Active</span>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Total Income
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 text-[10px] font-bold">
              Cumulative Total
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-white">
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total revenue accrued from all verified revenue pools</p>
          </div>
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Status</span>
            <span className="font-mono text-cyan-400 font-bold">Verified in Ledger</span>
          </div>
        </div>
      </div>

      {/* Breakdown Explanations */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">How PayCrypto Income Is Calculated</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-600" /> Level Income Mechanism
            </div>
            <p>
              When a trader joins through your affiliate link and completes a verified payment or deposit, the system calculates multi-tier referral income:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
              <li><strong>Level 1:</strong> 5.0% on direct invitee verified volume</li>
              <li><strong>Level 2:</strong> 2.0% on secondary network invites</li>
              <li><strong>Level 3:</strong> 1.0% on tertiary network volume</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> LTD (Long-Term Distribution) Income
            </div>
            <p>
              LTD distributes a percentage of platform transaction fees back to active traders and liquidity providers based on wallet activity and holding periods.
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
              <li>Distributed daily at 00:00 UTC</li>
              <li>All balance credits are locked into the immutable ledger</li>
              <li>Instantly withdrawable to bank or convertible to USDT</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
