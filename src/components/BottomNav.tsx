import React from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpRight,
  TrendingDown,
  Menu,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openMoreMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab, openMoreMenu }) => {
  const { isAdmin, activeRole } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            currentTab === 'dashboard' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Wallet</span>
        </button>

        {/* Deposit - Highlighted Yellow/Orange as requested */}
        <button
          onClick={() => setCurrentTab('deposit')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            currentTab === 'deposit'
              ? 'text-amber-600 font-bold'
              : 'text-amber-500 hover:text-amber-600'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-0.5 shadow-xs">
            <ArrowDownCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-amber-700">Deposit</span>
        </button>

        {/* Transfer */}
        <button
          onClick={() => setCurrentTab('transfer')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            currentTab === 'transfer' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ArrowUpRight className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Transfer</span>
        </button>

        {/* Sell */}
        <button
          onClick={() => setCurrentTab('sell')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            currentTab === 'sell' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingDown className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Sell</span>
        </button>

        {/* More / Menu */}
        <button
          onClick={openMoreMenu}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            ['bank-accounts', 'withdrawals', 'transactions', 'payments', 'referrals', 'income', 'admin'].includes(currentTab)
              ? 'text-cyan-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </nav>
  );
};
