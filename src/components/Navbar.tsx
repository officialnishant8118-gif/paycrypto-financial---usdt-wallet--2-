import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  Bell,
  User as UserIcon,
  Copy,
  Check,
  LogOut,
  ChevronDown,
  ShieldAlert,
  ArrowRightLeft,
  Key,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';
import { NotificationCenterModal } from './NotificationCenterModal.tsx';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { userProfile, isAdmin, activeRole, setActiveRole, signOut, signInQuickAccess, toggleTwoFactor } = useAuth();
  const { wallet, conversionRateUsdtInr, emailLogs } = useWallet();

  const [copiedId, setCopiedId] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleCopyUserId = () => {
    if (!userProfile?.userIdCode) return;
    navigator.clipboard.writeText(userProfile.userIdCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const toggleAdminView = () => {
    if (activeRole === 'admin') {
      setActiveRole('user');
      if (currentTab === 'admin') setCurrentTab('dashboard');
    } else {
      setActiveRole('admin');
      setCurrentTab('admin');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab('dashboard');
              }}
              className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Wallet className="w-4 h-4" />
              </div>
              <span>PayCrypto</span>
            </a>

            {/* Quiet Live Exchange Ticker */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>1 USDT</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums">₹{conversionRateUsdtInr.toFixed(2)}</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links for quick access on larger viewports */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`hover:text-slate-900 transition-colors ${currentTab === 'dashboard' ? 'text-cyan-700 font-bold' : ''}`}
            >
              Wallet
            </button>
            <button
              onClick={() => setCurrentTab('deposit')}
              className={`hover:text-slate-900 transition-colors ${currentTab === 'deposit' ? 'text-amber-700 font-bold' : ''}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setCurrentTab('transfer')}
              className={`hover:text-slate-900 transition-colors ${currentTab === 'transfer' ? 'text-cyan-700 font-bold' : ''}`}
            >
              Transfer
            </button>
            <button
              onClick={() => setCurrentTab('sell')}
              className={`hover:text-slate-900 transition-colors ${currentTab === 'sell' ? 'text-cyan-700 font-bold' : ''}`}
            >
              Sell USDT
            </button>
            <button
              onClick={() => setCurrentTab('withdrawals')}
              className={`hover:text-slate-900 transition-colors ${currentTab === 'withdrawals' ? 'text-blue-700 font-bold' : ''}`}
            >
              Bank Payout
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Action & Account Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Balances Summary (Desktop) */}
            {wallet && (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] leading-tight">INR</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    ₹{wallet.inrBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-5 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[10px] leading-tight">USDT</span>
                  <span className="font-bold text-cyan-700 font-mono tabular-nums">
                    {(wallet.usdtBalance + wallet.usdtBep20Balance).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Admin Switcher (Visible to Authorized Admins) */}
            {isAdmin && (
              <button
                onClick={toggleAdminView}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                  activeRole === 'admin'
                    ? 'bg-purple-700 text-white hover:bg-purple-800'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
                title="Toggle Admin View"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {activeRole === 'admin' ? 'Admin Active' : 'Admin Panel'}
                </span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="View notification & email dispatch log"
            >
              <Bell className="w-4 h-4" />
              {emailLogs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-600 ring-2 ring-white" />
              )}
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block">
                  <span className="block text-xs font-bold text-slate-900 leading-tight line-clamp-1">
                    {userProfile?.displayName || 'My Wallet'}
                  </span>
                  <span className="block text-[10px] text-cyan-600 font-mono tabular-nums">
                    {userProfile?.userIdCode || 'USR-***'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="p-3 bg-slate-50 rounded-xl mb-2">
                    <p className="text-xs font-bold text-slate-900">{userProfile?.displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userProfile?.email || 'N/A'}</p>

                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">User ID</span>
                        <span className="font-mono font-bold text-xs text-slate-800 tabular-nums">
                          {userProfile?.userIdCode || 'USR-000000'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUserId();
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedId ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTwoFactor();
                    }}
                  >
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Two-Factor Auth (2FA)
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {userProfile?.twoFactorEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAdminView();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 text-xs flex items-center justify-between text-purple-700 font-semibold mb-1"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4" />
                        Toggle Admin Console
                      </span>
                    </button>
                  )}

                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1">Testing Accounts</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        signInQuickAccess('officialnishant8118@gmail.com', 'Nishant (Admin)', 'admin');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[11px] text-slate-700 flex items-center justify-between"
                    >
                      <span>Nishant (Admin)</span>
                      <span className="text-[10px] text-purple-700 font-bold">Admin</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        signInQuickAccess('user.rahul@example.com', 'Rahul Kumar', 'user');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[11px] text-slate-700 flex items-center justify-between"
                    >
                      <span>Rahul Kumar (User)</span>
                      <span className="text-[10px] text-cyan-700 font-bold">Trader</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => {
                        signOut();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-rose-50 text-xs flex items-center gap-2 text-rose-600 font-semibold"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationCenterModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
};
