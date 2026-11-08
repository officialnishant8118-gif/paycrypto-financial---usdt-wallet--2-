import React from 'react';
import {
  X,
  Building2,
  Receipt,
  History,
  Users,
  PieChart,
  ShieldAlert,
  ArrowDownToLine,
  TrendingDown,
  ArrowUpRight,
  ArrowDownCircle,
  HelpCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
}) => {
  const { isAdmin, signOut, activeRole, setActiveRole } = useAuth();

  if (!isOpen) return null;

  const navigate = (tabId: string) => {
    setCurrentTab(tabId);
    onClose();
  };

  const navItems = [
    { id: 'bank-accounts', label: 'Bank Accounts', icon: Building2, desc: 'Manage verified bank accounts' },
    { id: 'withdrawals', label: 'INR Bank Withdrawal', icon: ArrowDownToLine, desc: 'Transfer balance to bank account' },
    { id: 'payments', label: 'Payment History', icon: Receipt, desc: 'Deposit requests and uploaded receipts' },
    { id: 'transactions', label: 'Transaction History', icon: History, desc: 'Full append-only ledger history' },
    { id: 'referrals', label: 'Referral System', icon: Users, desc: 'Partner links and multi-tier rewards' },
    { id: 'income', label: 'Income Analytics', icon: PieChart, desc: 'Level Income, LTD, Total Income' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-extrabold text-slate-900">More Financial Services</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition ${
                  isActive ? 'bg-cyan-50 text-cyan-800' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                  <span className="block text-[10px] text-slate-400">{item.desc}</span>
                </div>
              </button>
            );
          })}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => navigate('admin')}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-left bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-purple-950">Super Admin Console</span>
                  <span className="block text-[10px] text-purple-600">Review proofs, users & payouts</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">PayCrypto Mobile v2.4</span>
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
