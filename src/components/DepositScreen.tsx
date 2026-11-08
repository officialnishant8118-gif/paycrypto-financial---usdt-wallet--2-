import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowDownCircle,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Coins,
  History,
  Info,
  Clock,
  ExternalLink,
  ShieldCheck,
  Upload,
  Receipt,
  FileCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { CryptoNetwork } from '../lib/types.ts';
import { PaymentRequestScreen } from './PaymentRequestScreen.tsx';

const WALLET_ADDRESSES: Record<CryptoNetwork, { address: string; explorer: string }> = {
  TRC20: {
    address: 'TUFnjBjeXKbcgnnvrafFfMRU4JSvrM18o4',
    explorer: 'https://tronscan.org/#/address/TUFnjBjeXKbcgnnvrafFfMRU4JSvrM18o4',
  },
  BEP20: {
    address: '0x91F568a8342798e2C92a2a096c14C4F0C35B98A1',
    explorer: 'https://bscscan.com/address/0x91F568a8342798e2C92a2a096c14C4F0C35B98A1',
  },
};

export const DepositScreen: React.FC = () => {
  const { deposits, createDepositRecord } = useWallet();

  const [depositMode, setDepositMode] = useState<'crypto' | 'inr_proof'>('crypto');
  const [network, setNetwork] = useState<CryptoNetwork>('TRC20');
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const currentAddress = WALLET_ADDRESSES[network].address;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecordDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      setErrorMessage('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const rec = await createDepositRecord(network, currentAddress, amt);
      setSuccessNotice(`Deposit notice registered (ID: ${rec.depositId}). Awaiting blockchain network confirmations.`);
      setDepositAmount('');
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record deposit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            Deposit Funds
          </h2>
          <p className="text-xs text-slate-500">Deposit USDT on-chain or deposit INR via UPI/Bank transfer with proof upload</p>
        </div>

        {/* Segmented Mode Control */}
        <div className="flex p-1 rounded-xl bg-slate-200/70 border border-slate-200 text-xs font-semibold shrink-0">
          <button
            onClick={() => setDepositMode('crypto')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              depositMode === 'crypto' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Crypto USDT
          </button>
          <button
            onClick={() => setDepositMode('inr_proof')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              depositMode === 'inr_proof' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-600" />
            INR & Proof Upload
          </button>
        </div>
      </div>

      {depositMode === 'inr_proof' ? (
        <PaymentRequestScreen />
      ) : (
        <>
          {/* Main Deposit Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            {/* Network Selector Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                1. Select Crypto Network
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNetwork('TRC20')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors flex items-center justify-between cursor-pointer ${
                    network === 'TRC20'
                      ? 'border-amber-500 bg-amber-50/40 text-amber-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      TRX
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block">TRON / TRC20</span>
                      <span className="text-[11px] text-slate-500 block">Fastest settlement (~1 min)</span>
                    </div>
                  </div>
                  {network === 'TRC20' && <Check className="w-5 h-5 text-amber-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setNetwork('BEP20')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors flex items-center justify-between cursor-pointer ${
                    network === 'BEP20'
                      ? 'border-sky-500 bg-sky-50/40 text-sky-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                      BSC
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block">BNB Smart Chain / BEP20</span>
                      <span className="text-[11px] text-slate-500 block">Lower gas fee network</span>
                    </div>
                  </div>
                  {network === 'BEP20' && <Check className="w-5 h-5 text-sky-600" />}
                </button>
              </div>
            </div>

            {/* MANDATORY WARNING BANNER */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-950">Important Network Safety Notice:</p>
                <p className="leading-relaxed">
                  Send only <strong className="font-bold">USDT using the {network} network</strong> to this address.
                  Never mix TRC20 and BEP20 addresses. Sending any other currency or using the wrong network will result in permanent loss of funds.
                </p>
              </div>
            </div>

            {/* QR Code and Wallet Address Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
              {/* QR Code */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                  <QRCodeSVG
                    value={currentAddress}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-600 mt-3 font-mono tabular-nums">
                  Scan with any {network} Wallet
                </span>
              </div>

              {/* Wallet Address & Copy */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deposit Wallet Address ({network})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentAddress}
                      className="w-full font-mono tabular-nums text-xs sm:text-sm font-bold text-slate-900 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-700" /> Deposit Instructions
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li>Minimum deposit: <strong className="text-slate-800">100 USDT</strong></li>
                    <li>Required confirmations: <strong className="text-slate-800">12 block confirmations</strong></li>
                    <li>Balances are credited automatically upon verified blockchain finalization.</li>
                  </ul>
                </div>

                {/* Register on-chain deposit notification */}
                <form onSubmit={handleRecordDeposit} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sent amount (USDT)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 p-3 text-xs border border-slate-200 rounded-xl font-mono tabular-nums focus:border-cyan-500 focus:outline-hidden bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Registering...' : 'I have Sent Funds'}
                  </button>
                </form>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successNotice}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deposit History */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" /> On-Chain Deposit History
            </h3>

            {deposits.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No on-chain deposits registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="pb-3 pl-2">Deposit ID</th>
                      <th className="pb-3">Network</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Wallet Address</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-2 font-mono tabular-nums font-bold text-slate-800">{dep.depositId}</td>
                        <td className="py-3 font-semibold text-slate-700">{dep.network}</td>
                        <td className="py-3 font-mono tabular-nums font-bold text-slate-900">{dep.amount.toFixed(2)} USDT</td>
                        <td className="py-3 font-mono tabular-nums text-slate-500 text-[11px] truncate max-w-[140px]">
                          {dep.walletAddress}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              dep.status === 'Confirmed' ? 'bg-emerald-500' : dep.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span className={dep.status === 'Confirmed' ? 'text-emerald-700' : dep.status === 'Pending' ? 'text-amber-700' : 'text-rose-700'}>
                              {dep.status}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right font-mono tabular-nums text-slate-400">
                          {new Date(dep.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
