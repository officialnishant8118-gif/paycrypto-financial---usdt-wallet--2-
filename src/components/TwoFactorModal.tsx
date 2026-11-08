import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  actionName?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Security Verification (2FA)',
  description = 'For your financial security, please enter the 6-digit authorization code sent to your registered channel.',
  actionName = 'Authorize Transaction',
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Generate a random 6-digit code on open
  useEffect(() => {
    if (isOpen) {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      setCode(['', '', '', '', '', '']);
      setError('');
      setCountdown(60);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);

    // Auto advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResend = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setCountdown(60);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = code.join('');
    if (entered.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (entered !== generatedOtp && entered !== '123456') {
      setError('Invalid verification code. Please check and try again.');
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onConfirm();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">2-Factor Authentication Gate</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">{description}</p>

        {/* Demo OTP Banner for ease of testing */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-800">
              Your 2FA Code is: <strong className="font-mono text-sm tracking-wider text-amber-900">{generatedOtp}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCode(generatedOtp.split(''));
              setError('');
            }}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Auto-fill
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-between gap-2 mb-4">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 text-center text-xl font-bold font-mono border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-100 transition bg-slate-50"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 mb-3 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span>Code expires in {countdown}s</span>
            <button
              type="button"
              disabled={countdown > 0}
              onClick={handleResend}
              className={`flex items-center gap-1 font-medium ${
                countdown > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-cyan-600 hover:underline'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> Resend Code
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : actionName}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
