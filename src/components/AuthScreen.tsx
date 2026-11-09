import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Mail, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AuthScreen: React.FC = () => {
  const { currentUser, authError, clearAuthError, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, signOut } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const changeMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setMessage('');
    setFormError('');
    clearAuthError();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setFormError('');
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
        setMessage('Account created. You are signing in now.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to continue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setMessage('');
    setFormError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setFormError('Enter your email address first, then choose Forgot password.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setMessage('');
    try {
      await resetPassword(email);
      setMessage('If an account exists for this email, a password reset link has been sent.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to send a password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleError = formError || authError;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-900 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl min-h-[620px] grid lg:grid-cols-2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-cyan-950/30">
        <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 text-slate-950">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">PayCrypto</span>
          </div>
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
              <ShieldCheck className="h-4 w-4" /> Secure account access
            </span>
            <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
              Your wallet starts with a secure sign in.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Sign in to your account or create one with your email to access your wallet.
            </p>
          </div>
          <p className="text-xs text-slate-400">Never share your password or verification links with anyone.</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-cyan-300">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-lg font-extrabold">PayCrypto</span>
            </div>

            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">PayCrypto Wallet</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'login' ? 'Enter your details to sign in.' : 'Use your email to get started securely.'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => changeMode('login')}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => changeMode('signup')}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Create account
              </button>
            </div>

            {(visibleError || message) && (
              <div
                role={visibleError ? 'alert' : 'status'}
                className={`mb-5 rounded-xl border px-4 py-3 text-sm leading-5 ${visibleError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
              >
                {visibleError || message}
                {visibleError && currentUser && <button type="button" className="ml-1 font-bold underline" onClick={() => void signOut()}>Sign out and try again</button>}
              </div>
            )}

            <form className="space-y-4" onSubmit={submit}>
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Full name</span>
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10">
                    <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      autoComplete="name"
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      maxLength={80}
                      minLength={2}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      required
                      value={name}
                    />
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Email address</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    autoComplete="email"
                    className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Password</span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10">
                  <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-slate-400 hover:text-slate-700"
                    onClick={() => setShowPassword((shown) => !shown)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button className="text-xs font-bold text-cyan-700 hover:text-cyan-900" onClick={handlePasswordReset} type="button">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or continue with</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              disabled={submitting}
              onClick={handleGoogleSignIn}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.9 46.98 24.55Z" />
                <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
              Your account is protected by Firebase Authentication.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
