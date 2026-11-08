import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowDownCircle,
  ArrowUpRight,
  TrendingDown,
  ArrowDownToLine,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { TransactionType, TransactionStatus } from '../lib/types.ts';

export const TransactionHistoryScreen: React.FC = () => {
  const { transactions } = useWallet();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const types = ['All', 'Deposit', 'Transfer', 'Sell', 'Withdrawal', 'Refund'];
  const statuses = ['All', 'Completed', 'Pending', 'Processing', 'Rejected'];

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);

    const matchesType = selectedType === 'All' || tx.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || tx.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          Comprehensive Transaction History
        </h2>
        <p className="text-xs text-slate-500">Append-only verified ledger records of all deposits, transfers, sales, and withdrawals</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Reference ID, amount, currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  Type: {t}
                </option>
              ))}
            </select>

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
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                selectedType === t
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <History className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No transactions match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">Reference ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Fee</th>
                  <th className="pb-3">Previous Bal</th>
                  <th className="pb-3">New Bal</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 pl-2 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            tx.type === 'Deposit'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.type === 'Transfer'
                              ? 'bg-cyan-100 text-cyan-700'
                              : tx.type === 'Sell'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tx.type === 'Deposit' && <ArrowDownCircle className="w-4 h-4" />}
                          {tx.type === 'Transfer' && <ArrowUpRight className="w-4 h-4" />}
                          {tx.type === 'Sell' && <TrendingDown className="w-4 h-4" />}
                          {tx.type === 'Withdrawal' && <ArrowDownToLine className="w-4 h-4" />}
                          {tx.type === 'Refund' && <RefreshCw className="w-4 h-4" />}
                        </span>
                        <span>{tx.type}</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-slate-600">{tx.referenceId}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      {tx.currency} {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 font-mono text-slate-500">
                      {tx.fee ? `${tx.currency} ${tx.fee}` : '0.00'}
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {tx.previousBalance !== undefined ? tx.previousBalance.toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-700">
                      {tx.newBalance !== undefined ? tx.newBalance.toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : tx.status === 'Processing'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        {tx.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right font-mono text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
