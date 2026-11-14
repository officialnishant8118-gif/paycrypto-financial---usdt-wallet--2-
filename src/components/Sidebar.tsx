import React from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpRight,
  TrendingDown,
  Building2,
  Receipt,
  History,
  Users,
  PieChart,
  ShieldAlert,
  ArrowDownToLine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { isAdmin } = useAuth();
  const { allPayments, allWithdrawals } = useWallet();

  const pendingPaymentsCount = allPayments.filter((p) => p.status === 'Under Review' || p.status === 'Pending').length;
  const pendingWithdrawalsCount = allWithdrawals.filter((w) => w.status === 'Pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Wallet Overview', icon: LayoutDashboard },
    {
      id: 'deposit',
      label: 'Deposit USDT / INR',
      icon: ArrowDownCircle,
      accent: 'text-amber-600',
    },
    { id: 'transfer', label: 'Transfer USDT', icon: ArrowUpRight, accent: 'text-cyan-600' },
    { id: 'sell', label: 'Sell USDT', icon: TrendingDown, accent: 'text-sky-600' },
    { id: 'withdrawals', label: 'Bank Withdrawal', icon: ArrowDownToLine, accent: 'text-blue-600' },
    { id: 'bank-accounts', label: 'Bank Accounts', icon: Building2 },
    { id: 'payments', label: 'Payment History', icon: Receipt },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'referrals', label: 'Referral System', icon: Users },
    { id: 'income', label: 'Income Analytics', icon: PieChart },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-900' : item.accent || 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administration Section (Visible to Admins) */}
        {isAdmin && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                Administration
              </p>
              <span className="text-[10px] font-bold text-purple-700">
                Admin
              </span>
            </div>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">Admin Dashboard</span>
              </div>
              {(pendingPaymentsCount > 0 || pendingWithdrawalsCount > 0) && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-amber-950">
                  {pendingPaymentsCount + pendingWithdrawalsCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Settlement Market Card */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="p-3.5 bg-slate-900 rounded-xl text-white shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Settlement
            </span>
            <span className="text-[10px] font-mono text-cyan-300">P2P</span>
          </div>
          <p className="text-base font-extrabold text-white font-mono tabular-nums">
            1 USDT = ₹130.50
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Zero deposit fees. Instant IMPS settlement.
          </p>
        </div>

        <div className="text-[11px] text-slate-400 px-2 flex items-center justify-between font-medium">
          <span>PayCrypto Platform</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
          </span>
        </div>
      </div>
    </aside>
  );
};
