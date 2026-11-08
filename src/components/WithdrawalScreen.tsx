import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { TwoFactorModal } from './TwoFactorModal.tsx';

interface WithdrawalScreenProps {
  setCurrentTab: (tab: string) => void;
}

export const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({ setCurrentTab }) => {
  const { wallet, bankAccounts, withdrawals, requestWithdrawal } = useWallet();

  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [is2FaOpen, setIs2FaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  React.useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankId) {
      const primary = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
      setSelectedBankId(primary.id);
    }
  }, [bankAccounts, selectedBankId]);

  const numAmount = parseFloat(amount) || 0;
  const inrBalance = wallet?.inrBalance || 0;
  const fee = 25.0; // Flat ₹25 processing fee
  const totalDeduction = numAmount > 0 ? numAmount + fee : 0;

  const handleSetMax = () => {
    const maxWithdrawable = Math.max(0, inrBalance - fee);
    setAmount(maxWithdrawable > 0 ? maxWithdrawable.toString() : '0');
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (numAmount < 100) {
      setErrorMessage('Minimum bank withdrawal amount is ₹100.');
      return;
    }
    if (totalDeduction > inrBalance) {
      setErrorMessage(`Insufficient INR balance. You need ₹${totalDeduction.toLocaleString('en-IN')} (including ₹${fee} IMPS processing fee), but only have ₹${inrBalance.toLocaleString('en-IN')}.`);
      return;
    }
    if (!selectedBankId) {
      setErrorMessage('Please select a verified bank account for payout.');
      return;
    }

    setIs2FaOpen(true);
  };

  const handleExecuteWithdrawal = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await requestWithdrawal(numAmount, selectedBankId);
      setSuccessNotice(`Withdrawal request submitted! Reference ID: ${res.referenceId}. Funds will be transferred via IMPS.`);
      setAmount('');
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          INR Bank Transfer / Withdrawal
        </h2>
        <p className="text-xs text-slate-500">Direct instant IMPS bank payout to your verified Indian bank account</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <form onSubmit={handlePreSubmit} className="space-y-5">
          {/* Available Balance Banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Withdrawable Balance</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                ₹{inrBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSetMax}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition border border-blue-200"
            >
              Withdraw Max
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Withdrawal Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-base">
                ₹
              </span>
              <input
                type="number"
                min="100"
                step="1"
                required
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-lg font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Minimum withdrawal: ₹100 • 24x7 IMPS processing</p>
          </div>

          {/* Select Bank Account */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Destination Bank Account
              </label>
              <button
                type="button"
                onClick={() => setCurrentTab('bank-accounts')}
                className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Manage Bank Accounts
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <span>You need to link a bank account before requesting a withdrawal.</span>
                <button
                  type="button"
                  onClick={() => setCurrentTab('bank-accounts')}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700"
                >
                  Add Bank Account
                </button>
              </div>
            ) : (
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-cyan-500"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumberMasked} ({b.accountHolderName}) {b.isPrimary ? '• Primary' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fee & Calculation Summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Withdrawal Amount</span>
              <strong className="text-slate-800 font-mono">₹{numAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>IMPS Banking Processing Fee</span>
              <strong className="text-slate-800 font-mono">₹{fee.toFixed(2)}</strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total Debited from Wallet</span>
              <span className="text-blue-700 font-mono text-sm">
                ₹{totalDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || bankAccounts.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm & Proceed to 2FA Verification'}
          </button>
        </form>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" /> Bank Withdrawal History
        </h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No withdrawal requests made yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Withdrawal ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Bank Account</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-800">{w.referenceId}</td>
                    <td className="py-3 font-mono font-bold text-slate-900">₹{w.amount.toLocaleString()}</td>
                    <td className="py-3 font-mono text-slate-600">{w.bankAccountMasked}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'Processing'
                            ? 'bg-sky-100 text-sky-800'
                            : w.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        {w.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {w.status}
                      </span>
                      {w.rejectionReason && (
                        <span className="block text-[10px] text-rose-600 mt-0.5">{w.rejectionReason}</span>
                      )}
                    </td>
                    <td className="py-3 pr-2 text-right font-mono text-slate-400">
                      {new Date(w.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TwoFactorModal
        isOpen={is2FaOpen}
        onClose={() => setIs2FaOpen(false)}
        onConfirm={handleExecuteWithdrawal}
        title="Authorize INR Bank Withdrawal"
        description={`Enter verification code to transfer ₹${numAmount.toLocaleString('en-IN')} (Total with fee: ₹${totalDeduction.toLocaleString('en-IN')}) to your bank account.`}
        actionName="Authorize Withdrawal"
      />
    </div>
  );
};
