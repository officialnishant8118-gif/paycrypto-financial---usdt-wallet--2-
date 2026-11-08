import React, { useState } from 'react';
import {
  ArrowUpRight,
  ClipboardPaste,
  ShieldCheck,
  AlertCircle,
  Clock,
  History,
  Info,
  CheckCircle2,
  RefreshCw,
  Coins,
  Layers,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { CryptoNetwork } from '../lib/types.ts';
import { TwoFactorModal } from './TwoFactorModal.tsx';

export const TransferScreen: React.FC = () => {
  const { wallet, transfers, transferUsdt } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [network, setNetwork] = useState<CryptoNetwork>('TRC20');
  const [amount, setAmount] = useState('');
  const [is2FaOpen, setIs2FaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fee = network === 'TRC20' ? 1.0 : 0.5;
  const numAmount = parseFloat(amount) || 0;
  const totalDeduction = numAmount > 0 ? numAmount + fee : 0;

  const currentAvailable = network === 'TRC20' ? (wallet?.usdtBalance || 0) : (wallet?.usdtBep20Balance || 0);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setRecipient(text.trim());
    } catch {
      // ignore
    }
  };

  const handleSetMax = () => {
    const maxAvailable = Math.max(0, currentAvailable - fee);
    setAmount(maxAvailable > 0 ? maxAvailable.toFixed(2) : '0');
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!recipient.trim()) {
      setErrorMessage('Please enter a recipient wallet address.');
      return;
    }
    if (recipient.trim().length < 24) {
      setErrorMessage('Invalid wallet address format.');
      return;
    }
    if (numAmount <= 0) {
      setErrorMessage('Transfer amount must be greater than zero.');
      return;
    }
    if (totalDeduction > currentAvailable) {
      setErrorMessage(`Insufficient balance. You need ${totalDeduction.toFixed(2)} USDT (including ${fee} USDT fee), but only have ${currentAvailable.toFixed(2)} USDT.`);
      return;
    }

    // Open 2FA modal
    setIs2FaOpen(true);
  };

  const handleExecuteTransfer = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const rec = await transferUsdt(recipient.trim(), network, numAmount);
      setSuccessNotice(`Transfer of ${numAmount} USDT successfully completed! Ref: ${rec.referenceId}`);
      setAmount('');
      setRecipient('');
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          Transfer USDT
        </h2>
        <p className="text-xs text-slate-500">Send USDT securely across TRON or Binance Smart Chain networks</p>
      </div>

      {/* Main Transfer Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <form onSubmit={handlePreSubmit} className="space-y-5">
          {/* Network Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Blockchain Network
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNetwork('TRC20')}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                  network === 'TRC20'
                    ? 'border-cyan-600 bg-cyan-50/40 text-cyan-950 font-bold'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="block text-sm">TRON / TRC20</span>
                    <span className="text-[11px] text-slate-400 font-normal">Fee: 1.0 USDT</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold">
                  {(wallet?.usdtBalance || 0).toFixed(2)} USDT
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNetwork('BEP20')}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                  network === 'BEP20'
                    ? 'border-cyan-600 bg-cyan-50/40 text-cyan-950 font-bold'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-sky-500" />
                  <div>
                    <span className="block text-sm">BSC / BEP20</span>
                    <span className="text-[11px] text-slate-400 font-normal">Fee: 0.5 USDT</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold">
                  {(wallet?.usdtBep20Balance || 0).toFixed(2)} USDT
                </span>
              </button>
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recipient Wallet Address
              </label>
              <button
                type="button"
                onClick={handlePaste}
                className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1"
              >
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste Address
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={network === 'TRC20' ? 'e.g. TX8yv3hL4g9M2q...' : 'e.g. 0x71C...B492'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Amount & Available Balance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Transfer Amount
              </label>
              <div className="text-xs text-slate-500">
                Available:{' '}
                <strong className="text-slate-800 font-mono">
                  {currentAvailable.toFixed(2)} USDT
                </strong>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-4 pr-20 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-lg font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400 font-mono mr-1">USDT</span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Transfer Network</span>
              <strong className="text-slate-800">{network}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Network Gas Fee</span>
              <strong className="text-slate-800 font-mono">{fee.toFixed(2)} USDT</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Recipient Gets</span>
              <strong className="text-slate-800 font-mono">{numAmount > 0 ? numAmount.toFixed(2) : '0.00'} USDT</strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total Wallet Deduction</span>
              <span className="text-cyan-700 font-mono text-sm">{totalDeduction.toFixed(2)} USDT</span>
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

          {/* Submission Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm & Proceed to 2FA Verification'}
          </button>
        </form>
      </div>

      {/* Transfer History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" /> Transfer Records
        </h3>

        {transfers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transfer records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Reference ID</th>
                  <th className="pb-3">Network</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Recipient</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-800">{t.referenceId}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {t.network}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900">{t.amount.toFixed(2)} USDT</td>
                    <td className="py-3 font-mono text-slate-500 text-[11px] truncate max-w-[140px]">
                      {t.recipientAddress}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> {t.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-mono text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2FA Verification Modal */}
      <TwoFactorModal
        isOpen={is2FaOpen}
        onClose={() => setIs2FaOpen(false)}
        onConfirm={handleExecuteTransfer}
        title="Authorize USDT Transfer"
        description={`Enter verification code to transfer ${numAmount} USDT (${network}) to ${recipient.slice(0, 8)}...`}
        actionName="Authorize Transfer"
      />
    </div>
  );
};
