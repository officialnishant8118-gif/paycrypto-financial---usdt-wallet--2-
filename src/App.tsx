import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { WalletProvider, useWallet } from './context/WalletContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { DepositScreen } from './components/DepositScreen.tsx';
import { TransferScreen } from './components/TransferScreen.tsx';
import { SellScreen } from './components/SellScreen.tsx';
import { BankAccountsScreen } from './components/BankAccountsScreen.tsx';
import { WithdrawalScreen } from './components/WithdrawalScreen.tsx';
import { TransactionHistoryScreen } from './components/TransactionHistoryScreen.tsx';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen.tsx';
import { ReferralScreen } from './components/ReferralScreen.tsx';
import { IncomeScreen } from './components/IncomeScreen.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { MobileMoreDrawer } from './components/MobileMoreDrawer.tsx';
import { RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const { loading: authLoading } = useAuth();
  const { loading: walletLoading } = useWallet();

  if (authLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/20 mb-3 animate-bounce">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-extrabold text-slate-800">Loading PayCrypto Secure Wallet...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to real-time financial ledger</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView setCurrentTab={setCurrentTab} />;
      case 'deposit':
        return <DepositScreen />;
      case 'transfer':
        return <TransferScreen />;
      case 'sell':
        return <SellScreen setCurrentTab={setCurrentTab} />;
      case 'withdrawals':
        return <WithdrawalScreen setCurrentTab={setCurrentTab} />;
      case 'bank-accounts':
        return <BankAccountsScreen />;
      case 'payments':
        return <PaymentHistoryScreen />;
      case 'transactions':
        return <TransactionHistoryScreen />;
      case 'referrals':
        return <ReferralScreen />;
      case 'income':
        return <IncomeScreen setCurrentTab={setCurrentTab} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <DashboardView setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Container with Sidebar (Desktop) and Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>

        {/* Dynamic Screen View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openMoreMenu={() => setMoreDrawerOpen(true)}
      />

      {/* Mobile More Services Drawer */}
      <MobileMoreDrawer
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <MainLayout />
      </WalletProvider>
    </AuthProvider>
  );
}
