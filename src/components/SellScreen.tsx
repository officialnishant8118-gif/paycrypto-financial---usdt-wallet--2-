import React, { useState } from 'react';
import {
  TrendingDown,
  Building2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  History,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { TwoFactorModal } from './TwoFactorModal.tsx';

interface SellScreenProps {
  setCurrentTab: (tab: string) => void;
}

export const SellScreen: React.FC<SellScreenProps> = ({ setCurrentTab }) => {
  const { wallet, bankAccounts, sellOrders, sellUsdt, conversionRateUsdtInr } = useWallet();

  const [usdtAmount, setUsdtAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [is2FaOpen, setIs2FaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Primary bank default
  React.useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankId) {
      const primary = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
      setSelectedBankId(primary.id);
    }
  }, [bankAccounts, selectedBankId]);

  const numUsdt = parseFloat(usdtAmount) || 0;
  const availableUsdt = wallet?.usdtBalance || 0;

  const grossInr = numUsdt * conversionRateUsdtInr;
  const feeInr = Math.round(grossInr * 0.005 * 100) / 100; // 0.5% fee
  const netInr = Math.round((grossInr - feeInr) * 100) / 100;

  const handlePercentage = (pct: number) => {
    const val = (availableUsdt * (pct / 100)).toFixed(2);
    setUsdtAmount(val);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (numUsdt <= 0) {
      setErrorMessage('Please enter an amount of USDT to sell.');
      return;
    }
    if (numUsdt > availableUsdt) {
      setErrorMessage(`Insufficient USDT balance. You only have ${availableUsdt.toFixed(2)} USDT available.`);
      return;
    }
    if (!selectedBankId) {
      setErrorMessage('Please select or add a verified bank account for INR settlement.');
      return;
    }

    setIs2FaOpen(true);
  };

  const handleExecuteSell = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await sellUsdt(numUsdt, selectedBankId);
      setSuccessNotice(`Successfully sold ${numUsdt} USDT for ₹${res.inrAmount.toLocaleString('en-IN')}! Credited to your wallet.`);
      setUsdtAmount('');
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sell failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          Sell USDT for INR
        </h2>
        <p className="text-xs text-slate-500">Instant liquidation of USDT directly into your INR wallet balance</p>
      </div>

      {/* Main Sell Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        {/* Rate Banner */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Liquidity Rate</span>
              <div className="text-base font-extrabold text-slate-900">
                1 USDT = <span className="text-emerald-600">₹{conversionRateUsdtInr.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block">Available USDT:</span>
            <span className="font-extrabold font-mono text-slate-900 text-sm">
              {availableUsdt.toFixed(2)} USDT
            </span>
          </div>
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-5">
          {/* USDT Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                USDT Amount to Sell
              </label>
              <div className="flex gap-1.5">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                className="w-full pl-4 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-lg font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                USDT
              </span>
            </div>
          </div>

          {/* Bank Account Selection */}
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
                <span>No verified bank accounts found. Please add a bank account first.</span>
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

          {/* Quotation Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Gross INR Value</span>
              <strong className="text-slate-800 font-mono">₹{grossInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Platform Fee (0.5%)</span>
              <strong className="text-slate-800 font-mono">₹{feeInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Net INR Received</span>
              <span className="text-emerald-600 font-mono text-base">
                ₹{netInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Sell Order'}
          </button>
        </form>
      </div>

      {/* Sell Order History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" /> Sell Order History
        </h3>

        {sellOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No sell orders executed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Order ID</th>
                  <th className="pb-3">Sold USDT</th>
                  <th className="pb-3">Rate</th>
                  <th className="pb-3">INR Received</th>
                  <th className="pb-3">Bank Ref</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellOrders.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-800">{s.referenceId}</td>
                    <td className="py-3 font-mono font-bold text-slate-900">{s.usdtAmount.toFixed(2)} USDT</td>
                    <td className="py-3 font-mono text-slate-600">₹{s.rate.toFixed(2)}</td>
                    <td className="py-3 font-mono font-bold text-emerald-600">₹{s.inrAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 font-mono text-slate-500">{s.bankAccountMasked}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> {s.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-mono text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
        onConfirm={handleExecuteSell}
        title="Confirm USDT Sell Liquidation"
        description={`Authorize selling ${numUsdt} USDT @ ₹${conversionRateUsdtInr} for ₹${netInr.toLocaleString('en-IN')} into your INR wallet balance.`}
        actionName="Authorize Sell Order"
      />
    </div>
  );
};
