import React from 'react';
import { X, Mail, Bell, CheckCircle2, ShieldAlert, ArrowUpRight, Clock } from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ADMIN_NOTIFICATION_EMAIL } from '../lib/notifications.ts';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ isOpen, onClose }) => {
  const { emailLogs, transactions } = useWallet();
  const { userProfile, isAdmin } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Notification & Email Dispatch Center</h3>
              <p className="text-xs text-slate-500">Live transaction alerts & SMTP dispatch logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-600" />
            Configured Admin Mail: <strong className="font-mono text-slate-800">{ADMIN_NOTIFICATION_EMAIL}</strong>
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>

        {/* Body / Logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {emailLogs.length === 0 ? (
            <div className="text-center py-10">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No email dispatches recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Dispatches occur on deposit requests, uploads, verifications, and withdrawals.</p>
            </div>
          ) : (
            emailLogs.map((log) => {
              let parsedPayload: Record<string, unknown> = {};
              try {
                parsedPayload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
              } catch {
                parsedPayload = { raw: log.payload };
              }

              const isForAdmin = log.recipientEmail.toLowerCase() === ADMIN_NOTIFICATION_EMAIL.toLowerCase();

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isForAdmin ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{log.subject}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span>
                      To: <strong className="text-slate-700 font-mono">{log.recipientEmail}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" /> {log.status}
                    </span>
                  </div>

                  {/* Sanitized payload preview */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-600 space-y-0.5">
                    {parsedPayload.userId ? <div>User ID: {String(parsedPayload.userId)}</div> : null}
                    {parsedPayload.transactionId ? <div>Ref/Tx ID: {String(parsedPayload.transactionId)}</div> : null}
                    {parsedPayload.amount !== undefined ? <div>Amount: {String(parsedPayload.currency)} {String(parsedPayload.amount)}</div> : null}
                    {parsedPayload.status ? <div>Status: {String(parsedPayload.status)}</div> : null}
                    {parsedPayload.maskedBankInfo ? <div>Bank: {String(parsedPayload.maskedBankInfo)}</div> : null}
                    {parsedPayload.additionalDetails ? <div>Details: {String(parsedPayload.additionalDetails)}</div> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
