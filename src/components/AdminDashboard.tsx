import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck,
  Eye,
  AlertCircle,
  Clock,
  Building2,
  Receipt,
  ArrowDownToLine,
  Users,
  History,
  Mail,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Lock,
  Layers,
  X,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { PaymentRequest, WithdrawalRecord } from '../lib/types.ts';
import { ADMIN_NOTIFICATION_EMAIL } from '../lib/notifications.ts';

export const AdminDashboard: React.FC = () => {
  const {
    allPayments,
    allWithdrawals,
    allUsersList,
    auditLogs,
    emailLogs,
    verifyPayment,
    rejectPayment,
    processWithdrawal,
  } = useWallet();

  const { userProfile, isAdmin } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'payments' | 'withdrawals' | 'users' | 'emails' | 'audit'
  >('payments');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<{ type: 'payment' | 'withdrawal'; id: string; refId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Confirmation dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">You must be logged in as an administrator to access this console.</p>
      </div>
    );
  }

  // Pending items counts
  const pendingPayments = allPayments.filter((p) => p.status === 'Under Review' || p.status === 'Pending');
  const pendingWithdrawals = allWithdrawals.filter((w) => w.status === 'Pending');

  // Quick stats
  const totalVerifiedVolume = allPayments
    .filter((p) => p.status === 'Verified')
    .reduce((sum, p) => sum + p.amount, 0);

  const promptVerifyPayment = (p: PaymentRequest) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Verify & Credit Deposit Payment',
      description: `Confirm verification of Payment ${p.referenceId}? This will atomically credit ${p.currency} ${p.amount.toLocaleString()} to user ${p.userId} and write an append-only ledger record.`,
      confirmLabel: 'Confirm & Credit Balance',
      onConfirm: async () => {
        setConfirmDialog(null);
        setActionLoading(true);
        setErrorMessage('');
        try {
          await verifyPayment(p.id, `Verified by admin ${userProfile?.email}`);
          setActionMessage(`Payment ${p.referenceId} successfully verified! Wallet credited.`);
          setTimeout(() => setActionMessage(''), 5000);
        } catch (err: any) {
          setErrorMessage(err.message || 'Verification failed');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      setErrorMessage('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    try {
      if (rejectingItem.type === 'payment') {
        await rejectPayment(rejectingItem.id, rejectReason.trim());
        setActionMessage(`Payment ${rejectingItem.refId} has been rejected.`);
      } else {
        await processWithdrawal(rejectingItem.id, 'Reject', rejectReason.trim());
        setActionMessage(`Withdrawal ${rejectingItem.refId} rejected and balance refunded to user.`);
      }
      setRejectingItem(null);
      setRejectReason('');
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const promptApproveWithdrawal = (w: WithdrawalRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Authorize Bank Withdrawal (IMPS)',
      description: `Confirm IMPS bank payout of ₹${w.amount.toLocaleString()} to ${w.bankAccountMasked} (Ref: ${w.referenceId})?`,
      confirmLabel: 'Approve & Mark Transferred',
      onConfirm: async () => {
        setConfirmDialog(null);
        setActionLoading(true);
        setErrorMessage('');
        try {
          await processWithdrawal(w.id, 'Approve');
          setActionMessage(`Withdrawal ${w.referenceId} marked as COMPLETED.`);
          setTimeout(() => setActionMessage(''), 5000);
        } catch (err: any) {
          setErrorMessage(err.message || 'Processing failed');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="font-bold text-purple-700">Super Admin Console</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-mono">
              Alerts: {ADMIN_NOTIFICATION_EMAIL}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" /> Administrative Console
          </h2>
          <p className="text-xs text-slate-500">
            Verify deposit proofs, authorize INR withdrawals, monitor users, and inspect immutable audit logs
          </p>
        </div>

        {actionMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Pending Deposits Proof
          </span>
          <div className="text-2xl font-black text-amber-600 font-mono tabular-nums">
            {pendingPayments.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires manual review</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Pending Bank Payouts
          </span>
          <div className="text-2xl font-black text-blue-600 font-mono tabular-nums">
            {pendingWithdrawals.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting IMPS transfer</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Registered Users
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {allUsersList.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active trader accounts</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Verified Inflow
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums truncate">
            ₹{totalVerifiedVolume.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Settled platform deposits</p>
        </div>
      </div>

      {/* Navigation Segmented Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {[
          { id: 'payments', label: `Payment Approvals (${pendingPayments.length})`, icon: Receipt },
          { id: 'withdrawals', label: `Bank Withdrawals (${pendingWithdrawals.length})`, icon: ArrowDownToLine },
          { id: 'users', label: `User Directory (${allUsersList.length})`, icon: Users },
          { id: 'emails', label: `Email Notification Logs (${emailLogs.length})`, icon: Mail },
          { id: 'audit', label: `Security & Audit Trail (${auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PAYMENT APPROVALS & SCREENSHOT VERIFICATION */}
      {activeAdminTab === 'payments' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Payment Verification Queue & Proof Review
            </h3>
            <p className="text-xs text-slate-500">
              Cross-reference the uploaded bank payment screenshot before approving. Verifying executes an atomic wallet balance credit.
            </p>
          </div>

          {allPayments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No payment requests in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="pb-3 pl-2">Ref ID</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Screenshot Proof</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pl-2 font-mono tabular-nums font-bold text-slate-900">{p.referenceId}</td>
                      <td className="py-3.5">
                        <span className="block font-semibold text-slate-800">{p.userEmail || p.userId.slice(0, 8)}</span>
                        <span className="block text-[10px] text-slate-400 font-mono tabular-nums">{p.userId}</span>
                      </td>
                      <td className="py-3.5 font-mono tabular-nums font-bold text-slate-900">
                        {p.currency} {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {p.proofUrl ? (
                          <button
                            onClick={() => setSelectedProofImg(p.proofUrl || null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Receipt
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">No proof uploaded</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'Verified' ? 'bg-emerald-500' : p.status === 'Under Review' ? 'bg-sky-500' : p.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span className={
                            p.status === 'Verified' ? 'text-emerald-700 font-semibold' : p.status === 'Under Review' ? 'text-sky-700' : p.status === 'Rejected' ? 'text-rose-700' : 'text-amber-700'
                          }>
                            {p.status}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        {p.status !== 'Verified' && p.status !== 'Rejected' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={actionLoading}
                              onClick={() => promptVerifyPayment(p)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Credit
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => setRejectingItem({ type: 'payment', id: p.id, refId: p.referenceId })}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {p.status === 'Verified' ? `Settled (${p.verifiedBy || 'Admin'})` : `Rejected: ${p.rejectionReason || 'N/A'}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANK WITHDRAWALS */}
      {activeAdminTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Bank Withdrawal Queue (IMPS Settlements)
            </h3>
            <p className="text-xs text-slate-500">
              Process customer INR withdrawal requests. Approving marks transfer completed; rejecting atomically refunds balance.
            </p>
          </div>

          {allWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No withdrawal requests recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="pb-3 pl-2">Withdrawal ID</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Bank Account</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pl-2 font-mono tabular-nums font-bold text-slate-900">{w.referenceId}</td>
                      <td className="py-3.5 font-semibold text-slate-800">{w.userEmail || w.userId.slice(0, 8)}</td>
                      <td className="py-3.5 font-mono tabular-nums font-bold text-slate-900">₹{w.amount.toLocaleString()}</td>
                      <td className="py-3.5 font-mono tabular-nums text-slate-600">{w.bankAccountMasked}</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            w.status === 'Completed' ? 'bg-emerald-500' : w.status === 'Processing' ? 'bg-sky-500' : w.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span className={
                            w.status === 'Completed' ? 'text-emerald-700 font-semibold' : w.status === 'Processing' ? 'text-sky-700' : w.status === 'Rejected' ? 'text-rose-700' : 'text-amber-700'
                          }>
                            {w.status}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        {w.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={actionLoading}
                              onClick={() => promptApproveWithdrawal(w)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Approve IMPS
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => setRejectingItem({ type: 'withdrawal', id: w.id, refId: w.referenceId })}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {w.status === 'Completed' ? 'Transferred' : `Rejected (${w.rejectionReason || 'N/A'})`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER DIRECTORY */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">User Directory & Balances</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">User ID Code</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 pr-2 text-right">UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsersList.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-2 font-mono tabular-nums font-bold text-slate-900">{u.userIdCode}</td>
                    <td className="py-3 font-semibold text-slate-800">{u.displayName}</td>
                    <td className="py-3 text-slate-600">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-mono tabular-nums text-[10px] text-slate-400">
                      {u.uid.slice(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL NOTIFICATION LOGS */}
      {activeAdminTab === 'emails' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Email Dispatcher Audit Log</h3>
              <p className="text-xs text-slate-500">
                All transactional notifications routed to <strong className="font-mono text-purple-700">{ADMIN_NOTIFICATION_EMAIL}</strong> and users
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Dispatcher
            </span>
          </div>

          <div className="space-y-3">
            {emailLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900">{log.subject}</span>
                  </div>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Recipient: <strong className="font-mono text-slate-800">{log.recipientEmail}</strong></span>
                  <span className="font-bold text-emerald-600">{log.status}</span>
                </div>
                <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono tabular-nums text-slate-700 overflow-x-auto">
                  {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Security & Operational Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Action</th>
                  <th className="pb-3">Entity Type</th>
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3 pr-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-2 font-mono tabular-nums font-bold text-purple-700">{log.action}</td>
                    <td className="py-3 font-semibold text-slate-700">{log.entityType}</td>
                    <td className="py-3 font-mono tabular-nums text-[11px] text-slate-500">{log.userId}</td>
                    <td className="py-3 text-slate-600 max-w-sm truncate">{log.details}</td>
                    <td className="py-3 pr-2 text-right font-mono tabular-nums text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Full Preview Modal */}
      {selectedProofImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setSelectedProofImg(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-sm">Payment Screenshot Proof Inspection</h4>
              <button
                onClick={() => setSelectedProofImg(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            <img
              src={selectedProofImg}
              alt="Uploaded Proof"
              className="max-h-[75vh] w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Reject {rejectingItem.type === 'payment' ? 'Payment Request' : 'Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reference: <strong className="font-mono tabular-nums text-slate-900">{rejectingItem.refId}</strong>.
              Enter the reason that will be communicated to the user and recorded in the audit log.
            </p>

            <textarea
              rows={3}
              required
              placeholder="e.g. UTR reference not found in bank statement, invalid amount, screenshot tampered"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal (replacing window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in">
            <h3 className="font-bold text-slate-900 text-base mb-1.5">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">{confirmDialog.description}</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
