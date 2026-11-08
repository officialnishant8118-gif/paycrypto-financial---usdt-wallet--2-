import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWallet } from '../context/WalletContext.tsx';

export const ReferralScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const { referrals, wallet } = useWallet();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = userProfile?.referralCode || 'PRO8829';
  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalCommission = referrals.reduce((sum, r) => sum + (r.commissionEarned || 0), 0);
  const activeMembersCount = referrals.filter((r) => r.status === 'Active').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          Referral & Affiliate Program
        </h2>
        <p className="text-xs text-slate-500">Invite traders and earn automated multi-tier commissions from verified deposits</p>
      </div>

      {/* Main Referral Link Card */}
      <div className="bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider text-cyan-100 inline-block mb-2">
            3-Tier Commission Network
          </span>
          <h3 className="text-2xl font-black">Your Unique Partner Link</h3>
          <p className="text-xs text-cyan-100 mt-1 max-w-lg">
            Share your link with colleagues and investors. When they sign up and verify deposits, your Level Income wallet is credited automatically.
          </p>
        </div>

        {/* Link Box */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-xs sm:text-sm font-semibold truncate text-white w-full sm:w-auto">
            {referralUrl}
          </span>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-4 py-2 bg-white text-cyan-800 rounded-xl font-bold text-xs hover:bg-cyan-50 transition shadow-sm flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link Copied' : 'Copy Link'}
            </button>
            <button
              onClick={handleCopyCode}
              className="flex-1 sm:flex-none px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-xs hover:bg-white/30 transition border border-white/30 flex items-center justify-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Award className="w-3.5 h-3.5" />}
              {copiedCode ? 'Code Copied' : `Code: ${referralCode}`}
            </button>
          </div>
        </div>

        {/* Commission Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 bg-white/10 rounded-2xl border border-white/15">
            <span className="text-[10px] uppercase font-bold text-cyan-200 block">Tier 1 (Direct)</span>
            <div className="text-xl font-extrabold mt-1">5.0% Reward</div>
            <p className="text-[11px] text-cyan-100 mt-0.5">On every direct referral verified deposit</p>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/15">
            <span className="text-[10px] uppercase font-bold text-cyan-200 block">Tier 2 (Secondary)</span>
            <div className="text-xl font-extrabold mt-1">2.0% Reward</div>
            <p className="text-[11px] text-cyan-100 mt-0.5">When your referrals invite friends</p>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/15">
            <span className="text-[10px] uppercase font-bold text-cyan-200 block">Tier 3 (Network)</span>
            <div className="text-xl font-extrabold mt-1">1.0% Reward</div>
            <p className="text-[11px] text-cyan-100 mt-0.5">Extended platform network volume</p>
          </div>
        </div>
      </div>

      {/* Referral Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Referrals
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {referrals.length} <span className="text-xs font-normal text-slate-400">Users</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Registered using your referral code</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Members
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {activeMembersCount} <span className="text-xs font-normal text-slate-400">Traders</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Active verified depositing accounts</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Referral Income Earned
          </span>
          <div className="text-2xl font-extrabold text-cyan-700 font-mono">
            ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Directly credited to verified balance</p>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" /> Referral Activity & Network History
        </h3>

        {referrals.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No referrals registered yet.</p>
            <p className="text-slate-400 mt-1">Copy and share your referral link to begin earning Level Income.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Referred User</th>
                  <th className="pb-3">Level Tier</th>
                  <th className="pb-3">Commission Earned</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-800">
                      {r.referredUserEmail ? `${r.referredUserEmail.slice(0, 3)}***@${r.referredUserEmail.split('@')[1]}` : r.referredUserId.slice(0, 8)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                        Level {r.level}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-600">
                      ₹{r.commissionEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> {r.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-mono text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
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
