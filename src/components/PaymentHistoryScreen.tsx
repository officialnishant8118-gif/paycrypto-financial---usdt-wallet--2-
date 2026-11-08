import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { PaymentStatus, PaymentMethod } from '../lib/types.ts';

export const PaymentHistoryScreen: React.FC = () => {
  const { paymentRequests } = useWallet();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const statuses = ['All', 'Pending', 'Under Review', 'Verified', 'Rejected'];
  const methods = ['All', 'UPI', 'IMPS', 'NEFT', 'USDT_TRC20', 'USDT_BEP20'];

  const filtered = paymentRequests.filter((p) => {
    const matchesSearch =
      p.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.amount.toString().includes(searchQuery) ||
      (p.userEmail && p.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchesMethod = selectedMethod === 'All' || p.paymentMethod === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          Payment & Deposit History
        </h2>
        <p className="text-xs text-slate-500">Track all deposit requests, screenshot proofs, and administrative verifications</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment Reference ID, amount, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  Method: {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                selectedStatus === s
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No payment records match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Payment ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Screenshot Proof</th>
                  <th className="pb-3">Verification Status</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 pr-2 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 pl-2 font-mono font-bold text-slate-900">{p.referenceId}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      {p.currency} {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {p.proofUrl ? (
                        <button
                          onClick={() => setPreviewImg(p.proofUrl || null)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 font-semibold text-[11px] hover:bg-cyan-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">No Proof</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Under Review'
                            ? 'bg-sky-100 text-sky-800'
                            : p.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status === 'Verified' && <CheckCircle2 className="w-3 h-3" />}
                        {p.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 max-w-xs truncate">
                      {p.rejectionReason ? (
                        <span className="text-rose-600 font-medium">{p.rejectionReason}</span>
                      ) : p.verifiedBy ? (
                        <span className="text-slate-400 text-[11px]">Verified by compliance</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right font-mono text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setPreviewImg(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl p-3 overflow-hidden shadow-2xl">
            <img
              src={previewImg}
              alt="Payment Proof"
              className="max-h-[75vh] w-auto rounded-2xl object-contain mx-auto"
            />
            <div className="p-3 text-center">
              <button
                onClick={() => setPreviewImg(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
