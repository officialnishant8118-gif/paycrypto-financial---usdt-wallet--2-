import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  runTransaction,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { useAuth } from './AuthContext.tsx';
import {
  WalletData,
  LedgerEntry,
  BankAccount,
  PaymentRequest,
  DepositRecord,
  TransferRecord,
  SellOrderRecord,
  WithdrawalRecord,
  TransactionRecord,
  ReferralRecord,
  AuditLogRecord,
  EmailNotificationRecord,
  PaymentMethod,
  CryptoNetwork,
} from '../lib/types.ts';
import { logAuditEvent } from '../lib/audit.ts';
import { notifyAdmin, sendEmailNotification } from '../lib/notifications.ts';

interface WalletContextType {
  wallet: WalletData | null;
  ledgerEntries: LedgerEntry[];
  bankAccounts: BankAccount[];
  paymentRequests: PaymentRequest[];
  deposits: DepositRecord[];
  transfers: TransferRecord[];
  sellOrders: SellOrderRecord[];
  withdrawals: WithdrawalRecord[];
  transactions: TransactionRecord[];
  referrals: ReferralRecord[];
  auditLogs: AuditLogRecord[];
  emailLogs: EmailNotificationRecord[];
  allUsersList: { uid: string; email: string; displayName: string; role: string; userIdCode: string }[];
  allPayments: PaymentRequest[]; // For admin
  allWithdrawals: WithdrawalRecord[]; // For admin
  loading: boolean;
  conversionRateUsdtInr: number;

  // Actions
  createPaymentRequest: (amount: number, currency: 'INR' | 'USDT_TRC20' | 'USDT_BEP20', paymentMethod: PaymentMethod) => Promise<PaymentRequest>;
  uploadPaymentProof: (paymentId: string, proofUrl: string, fileName: string, fileType: string, fileSize: number) => Promise<void>;
  createDepositRecord: (network: CryptoNetwork, walletAddress: string, amount: number) => Promise<DepositRecord>;
  transferUsdt: (recipientAddress: string, network: CryptoNetwork, amount: number) => Promise<TransferRecord>;
  sellUsdt: (usdtAmount: number, bankAccountId: string) => Promise<SellOrderRecord>;
  requestWithdrawal: (amount: number, bankAccountId: string) => Promise<WithdrawalRecord>;

  // Bank Account Actions
  addBankAccount: (data: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'accountNumberMasked'> & { fullAccountNumber: string }) => Promise<void>;
  editBankAccount: (id: string, data: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  setPrimaryBankAccount: (id: string) => Promise<void>;

  // Admin Actions
  verifyPayment: (paymentId: string, customNote?: string) => Promise<void>;
  rejectPayment: (paymentId: string, reason: string) => Promise<void>;
  processWithdrawal: (withdrawalId: string, action: 'Approve' | 'Reject', rejectionReason?: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, isAdmin } = useAuth();
  const userId = userProfile?.uid;

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [sellOrders, setSellOrders] = useState<SellOrderRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationRecord[]>([]);

  // Admin-wide collections
  const [allPayments, setAllPayments] = useState<PaymentRequest[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [allUsersList, setAllUsersList] = useState<{ uid: string; email: string; displayName: string; role: string; userIdCode: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const conversionRateUsdtInr = 113.50; // 1 USDT = ₹91.50 standard market rate

  // 1. Real-time Wallet listener for the active user
  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setLoading(false);
      return;
    }

    const walletRef = doc(db, 'wallets', userId);
    const unsubWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        setWallet(snap.data() as WalletData);
      }
    });

    // 2. Real-time Ledger entries for user
    const qLedger = query(
      collection(db, 'wallet_ledger'),
      where('userId', '==', userId),
      limit(100)
    );
    const unsubLedger = onSnapshot(qLedger, (snap) => {
      const items: LedgerEntry[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as LedgerEntry));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLedgerEntries(items);
    });

    // 3. Bank Accounts
    const qBank = query(collection(db, 'bank_accounts'), where('userId', '==', userId));
    const unsubBank = onSnapshot(qBank, (snap) => {
      const items: BankAccount[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as BankAccount));
      setBankAccounts(items);
    });

    // 4. Payment Requests
    const qPayments = query(collection(db, 'payments'), where('userId', '==', userId));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const items: PaymentRequest[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PaymentRequest));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPaymentRequests(items);
    });

    // 5. Deposits
    const qDeposits = query(collection(db, 'deposits'), where('userId', '==', userId));
    const unsubDeposits = onSnapshot(qDeposits, (snap) => {
      const items: DepositRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as DepositRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDeposits(items);
    });

    // 6. Transfers
    const qTransfers = query(collection(db, 'transfers'), where('userId', '==', userId));
    const unsubTransfers = onSnapshot(qTransfers, (snap) => {
      const items: TransferRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as TransferRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransfers(items);
    });

    // 7. Sell Orders
    const qSell = query(collection(db, 'sell_orders'), where('userId', '==', userId));
    const unsubSell = onSnapshot(qSell, (snap) => {
      const items: SellOrderRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SellOrderRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSellOrders(items);
    });

    // 8. Withdrawals
    const qWith = query(collection(db, 'withdrawals'), where('userId', '==', userId));
    const unsubWith = onSnapshot(qWith, (snap) => {
      const items: WithdrawalRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as WithdrawalRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawals(items);
    });

    // 9. Transactions
    const qTx = query(collection(db, 'transactions'), where('userId', '==', userId));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const items: TransactionRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as TransactionRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(items);
    });

    // 10. Referrals
    const qRef = query(collection(db, 'referrals'), where('referrerId', '==', userId));
    const unsubRef = onSnapshot(qRef, (snap) => {
      const items: ReferralRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as ReferralRecord));
      setReferrals(items);
    });

    setLoading(false);

    return () => {
      unsubWallet();
      unsubLedger();
      unsubBank();
      unsubPayments();
      unsubDeposits();
      unsubTransfers();
      unsubSell();
      unsubWith();
      unsubTx();
      unsubRef();
    };
  }, [userId]);

  // Admin Listeners (all payments, all withdrawals, audit logs, email logs, users)
  useEffect(() => {
    if (!isAdmin) {
      setAllPayments([]);
      setAllWithdrawals([]);
      setAllUsersList([]);
      setAuditLogs([]);
      setEmailLogs([]);
      return;
    }

    const unsubAllPayments = onSnapshot(collection(db, 'payments'), (snap) => {
      const items: PaymentRequest[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PaymentRequest));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllPayments(items);
    });

    const unsubAllWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snap) => {
      const items: WithdrawalRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as WithdrawalRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllWithdrawals(items);
    });

    const unsubAudit = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const items: AuditLogRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as AuditLogRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAuditLogs(items.slice(0, 150));
    });

    const unsubEmails = onSnapshot(collection(db, 'email_notifications'), (snap) => {
      const items: EmailNotificationRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as EmailNotificationRecord));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEmailLogs(items.slice(0, 150));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const items: { uid: string; email: string; displayName: string; role: string; userIdCode: string }[] = [];
      snap.forEach((d) => {
        const u = d.data();
        items.push({
          uid: u.uid || d.id,
          email: u.email || 'N/A',
          displayName: u.displayName || 'User',
          role: u.role || 'user',
          userIdCode: u.userIdCode || 'USR-***',
        });
      });
      setAllUsersList(items);
    });

    return () => {
      unsubAllPayments();
      unsubAllWithdrawals();
      unsubAudit();
      unsubEmails();
      unsubUsers();
    };
  }, [isAdmin]);

  // Create Payment / Deposit Request
  const createPaymentRequest = async (
    amount: number,
    currency: 'INR' | 'USDT_TRC20' | 'USDT_BEP20',
    paymentMethod: PaymentMethod
  ): Promise<PaymentRequest> => {
    if (!userId || !userProfile) throw new Error('Authentication required');
    if (amount <= 0) throw new Error('Invalid payment amount');

    const refId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReq: Omit<PaymentRequest, 'id'> = {
      userId,
      userEmail: userProfile.email,
      amount,
      currency,
      paymentMethod,
      referenceId: refId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'payments'), newReq);
    const created = { id: docRef.id, ...newReq };

    await logAuditEvent(userId, 'PAYMENT_REQUEST_CREATED', 'PaymentRequest', docRef.id, `Created request for ${currency} ${amount} via ${paymentMethod}`);
    await notifyAdmin(`New ${currency} Deposit/Payment Request`, 'NEW_PAYMENT_REQUEST', {
      userId: userProfile.userIdCode,
      paymentId: refId,
      amount,
      currency,
      status: 'Pending',
    });

    return created;
  };

  // Upload Payment Proof / Screenshot
  const uploadPaymentProof = async (
    paymentId: string,
    proofUrl: string,
    fileName: string,
    fileType: string,
    fileSize: number
  ) => {
    if (!userId) throw new Error('Authentication required');
    const paymentRef = doc(db, 'payments', paymentId);
    const snap = await getDoc(paymentRef);
    if (!snap.exists()) throw new Error('Payment request not found');

    const paymentData = snap.data() as PaymentRequest;
    if (paymentData.userId !== userId && !isAdmin) {
      throw new Error('Unauthorized');
    }

    const now = new Date().toISOString();
    await updateDoc(paymentRef, {
      proofUrl,
      proofFileName: fileName,
      proofFileType: fileType,
      proofFileSize: fileSize,
      uploadedAt: now,
      status: 'Under Review',
      updatedAt: now,
    });

    await logAuditEvent(
      userId,
      'PAYMENT_PROOF_UPLOADED',
      'PaymentRequest',
      paymentId,
      `Uploaded proof ${fileName} (${(fileSize / 1024).toFixed(1)} KB) for payment ${paymentData.referenceId}`
    );

    // Notify admin
    await notifyAdmin(`Payment Screenshot Uploaded`, 'PAYMENT_SCREENSHOT_UPLOADED', {
      userId: userProfile?.userIdCode || userId,
      paymentId: paymentData.referenceId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'Under Review',
      additionalDetails: `File: ${fileName}, Size: ${(fileSize / 1024).toFixed(1)} KB`,
    });
  };

  // Deposit On-Chain Record (USDT TRC20 or BEP20)
  const createDepositRecord = async (
    network: CryptoNetwork,
    walletAddress: string,
    amount: number
  ): Promise<DepositRecord> => {
    if (!userId) throw new Error('Authentication required');
    const depositId = `DEP-${network}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newDep: Omit<DepositRecord, 'id'> = {
      userId,
      depositId,
      network,
      walletAddress,
      amount,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'deposits'), newDep);

    await logAuditEvent(userId, 'CRYPTO_DEPOSIT_INITIATED', 'Deposit', docRef.id, `Network: ${network}, Amount: ${amount} USDT`);
    await notifyAdmin(`New USDT ${network} Deposit Initialized`, 'CRYPTO_DEPOSIT', {
      userId: userProfile?.userIdCode || userId,
      transactionId: depositId,
      amount,
      currency: `USDT_${network}`,
      status: 'Pending',
      additionalDetails: `Deposit Address: ${walletAddress}`,
    });

    return { id: docRef.id, ...newDep };
  };

  // USDT Transfer
  const transferUsdt = async (
    recipientAddress: string,
    network: CryptoNetwork,
    amount: number
  ): Promise<TransferRecord> => {
    if (!userId || !wallet) throw new Error('Wallet not available');
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

    const fee = network === 'TRC20' ? 1.0 : 0.5; // 1 USDT on TRC20, 0.5 USDT on BEP20
    const totalRequired = amount + fee;

    const availableBal = network === 'TRC20' ? wallet.usdtBalance : wallet.usdtBep20Balance;
    if (availableBal < totalRequired) {
      throw new Error(`Insufficient USDT balance (${availableBal.toFixed(2)} available, ${totalRequired.toFixed(2)} required with ${fee} USDT fee)`);
    }

    const refId = `TXF-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Run atomic transaction to deduct wallet balance and append ledger
    await runTransaction(db, async (t) => {
      const walletRef = doc(db, 'wallets', userId);
      const wSnap = await t.get(walletRef);
      if (!wSnap.exists()) throw new Error('Wallet document not found');

      const currentW = wSnap.data() as WalletData;
      const currentBal = network === 'TRC20' ? currentW.usdtBalance : currentW.usdtBep20Balance;
      if (currentBal < totalRequired) throw new Error('Insufficient balance');

      const newBal = currentBal - totalRequired;
      const updatePayload = network === 'TRC20'
        ? { usdtBalance: newBal, updatedAt: new Date().toISOString() }
        : { usdtBep20Balance: newBal, updatedAt: new Date().toISOString() };

      t.update(walletRef, updatePayload);

      // Ledger entry
      const ledgerRef = doc(collection(db, 'wallet_ledger'));
      t.set(ledgerRef, {
        userId,
        currency: network === 'TRC20' ? 'USDT_TRC20' : 'USDT_BEP20',
        type: 'debit',
        amount: totalRequired,
        previousBalance: currentBal,
        newBalance: newBal,
        transactionId: refId,
        source: 'USDT_TRANSFER',
        auditInfo: `Transfer ${amount} USDT to ${recipientAddress} (Fee: ${fee})`,
        createdAt: new Date().toISOString(),
      });

      // Transfer record
      const transferRef = doc(collection(db, 'transfers'));
      t.set(transferRef, {
        userId,
        recipientAddress,
        network,
        amount,
        fee,
        finalAmount: amount,
        referenceId: refId,
        status: 'Completed',
        createdAt: new Date().toISOString(),
      });

      // Transaction log
      const txRef = doc(collection(db, 'transactions'));
      t.set(txRef, {
        userId,
        type: 'Transfer',
        amount: totalRequired,
        currency: `USDT (${network})`,
        fee,
        status: 'Completed',
        referenceId: refId,
        previousBalance: currentBal,
        newBalance: newBal,
        createdAt: new Date().toISOString(),
      });
    });

    await logAuditEvent(userId, 'USDT_TRANSFER_COMPLETED', 'Transfer', refId, `Transferred ${amount} USDT to ${recipientAddress}`);
    await notifyAdmin(`USDT Transfer Executed`, 'USDT_TRANSFER', {
      userId: userProfile?.userIdCode || userId,
      transactionId: refId,
      amount,
      currency: `USDT_${network}`,
      status: 'Completed',
      additionalDetails: `Recipient: ${recipientAddress}, Fee: ${fee}`,
    });

    return {
      id: refId,
      userId,
      recipientAddress,
      network,
      amount,
      fee,
      finalAmount: amount,
      referenceId: refId,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };
  };

  // Sell USDT for INR
  const sellUsdt = async (usdtAmount: number, bankAccountId: string): Promise<SellOrderRecord> => {
    if (!userId || !wallet) throw new Error('Authentication & wallet required');
    if (usdtAmount <= 0) throw new Error('Invalid sell amount');

    // Check bank account
    const bAcc = bankAccounts.find((b) => b.id === bankAccountId);
    if (!bAcc) throw new Error('Selected bank account not found or unverified');

    const totalUsdtBal = wallet.usdtBalance;
    if (totalUsdtBal < usdtAmount) {
      throw new Error(`Insufficient USDT (TRC20) balance. Available: ${totalUsdtBal.toFixed(2)} USDT`);
    }

    const feePercent = 0.005; // 0.5% fee
    const grossInr = usdtAmount * conversionRateUsdtInr;
    const feeInr = Math.round(grossInr * feePercent * 100) / 100;
    const finalInr = Math.round((grossInr - feeInr) * 100) / 100;

    const refId = `SELL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    await runTransaction(db, async (t) => {
      const walletRef = doc(db, 'wallets', userId);
      const wSnap = await t.get(walletRef);
      if (!wSnap.exists()) throw new Error('Wallet not found');

      const currentW = wSnap.data() as WalletData;
      if (currentW.usdtBalance < usdtAmount) throw new Error('Insufficient USDT');

      const newUsdtBal = currentW.usdtBalance - usdtAmount;
      const prevInrBal = currentW.inrBalance;
      const newInrBal = prevInrBal + finalInr;

      // Update wallet: deduct USDT, credit INR
      t.update(walletRef, {
        usdtBalance: newUsdtBal,
        inrBalance: newInrBal,
        updatedAt: new Date().toISOString(),
      });

      // Ledger: USDT Debit
      const usdtLedgerRef = doc(collection(db, 'wallet_ledger'));
      t.set(usdtLedgerRef, {
        userId,
        currency: 'USDT_TRC20',
        type: 'debit',
        amount: usdtAmount,
        previousBalance: currentW.usdtBalance,
        newBalance: newUsdtBal,
        transactionId: refId,
        source: 'SELL_USDT_DEBIT',
        auditInfo: `Sold ${usdtAmount} USDT @ ₹${conversionRateUsdtInr}`,
        createdAt: new Date().toISOString(),
      });

      // Ledger: INR Credit
      const inrLedgerRef = doc(collection(db, 'wallet_ledger'));
      t.set(inrLedgerRef, {
        userId,
        currency: 'INR',
        type: 'credit',
        amount: finalInr,
        previousBalance: prevInrBal,
        newBalance: newInrBal,
        transactionId: refId,
        source: 'SELL_USDT_INR_CREDIT',
        auditInfo: `Proceeds for selling ${usdtAmount} USDT to bank ${bAcc.accountNumberMasked}`,
        createdAt: new Date().toISOString(),
      });

      // Sell Order record
      const sellRef = doc(collection(db, 'sell_orders'));
      t.set(sellRef, {
        userId,
        usdtAmount,
        rate: conversionRateUsdtInr,
        inrAmount: finalInr,
        fee: feeInr,
        bankAccountId,
        bankAccountMasked: bAcc.accountNumberMasked,
        referenceId: refId,
        status: 'Completed',
        createdAt: new Date().toISOString(),
      });

      // Transaction log
      const txRef = doc(collection(db, 'transactions'));
      t.set(txRef, {
        userId,
        type: 'Sell',
        amount: usdtAmount,
        currency: 'USDT',
        fee: feeInr,
        status: 'Completed',
        referenceId: refId,
        previousBalance: currentW.usdtBalance,
        newBalance: newUsdtBal,
        createdAt: new Date().toISOString(),
      });
    });

    await logAuditEvent(userId, 'SELL_USDT_COMPLETED', 'SellOrder', refId, `Sold ${usdtAmount} USDT for ₹${finalInr} to ${bAcc.bankName}`);
    await notifyAdmin(`USDT Sell Order Completed`, 'SELL_USDT', {
      userId: userProfile?.userIdCode || userId,
      transactionId: refId,
      amount: usdtAmount,
      currency: 'USDT',
      status: 'Completed',
      maskedBankInfo: `${bAcc.bankName} (${bAcc.accountNumberMasked})`,
      additionalDetails: `INR Credited: ₹${finalInr}, Rate: ₹${conversionRateUsdtInr}`,
    });

    return {
      id: refId,
      userId,
      usdtAmount,
      rate: conversionRateUsdtInr,
      inrAmount: finalInr,
      fee: feeInr,
      bankAccountId,
      bankAccountMasked: bAcc.accountNumberMasked,
      referenceId: refId,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };
  };

  // Request INR Bank Withdrawal
  const requestWithdrawal = async (amount: number, bankAccountId: string): Promise<WithdrawalRecord> => {
    if (!userId || !wallet || !userProfile) throw new Error('Authentication required');
    if (amount < 100) throw new Error('Minimum withdrawal amount is ₹100');

    const bAcc = bankAccounts.find((b) => b.id === bankAccountId);
    if (!bAcc) throw new Error('Bank account not found');

    const fee = 25.0; // Flat ₹25 processing fee
    const totalRequired = amount + fee;

    if (wallet.inrBalance < totalRequired) {
      throw new Error(`Insufficient INR balance (₹${wallet.inrBalance.toLocaleString('en-IN')} available, ₹${totalRequired.toLocaleString('en-IN')} required including ₹${fee} fee)`);
    }

    const refId = `WDL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Atomically reserve/deduct balance upon request
    await runTransaction(db, async (t) => {
      const walletRef = doc(db, 'wallets', userId);
      const wSnap = await t.get(walletRef);
      if (!wSnap.exists()) throw new Error('Wallet not found');

      const currentW = wSnap.data() as WalletData;
      if (currentW.inrBalance < totalRequired) throw new Error('Insufficient INR balance');

      const newBal = currentW.inrBalance - totalRequired;
      t.update(walletRef, {
        inrBalance: newBal,
        updatedAt: new Date().toISOString(),
      });

      // Ledger entry for debit
      const ledgerRef = doc(collection(db, 'wallet_ledger'));
      t.set(ledgerRef, {
        userId,
        currency: 'INR',
        type: 'debit',
        amount: totalRequired,
        previousBalance: currentW.inrBalance,
        newBalance: newBal,
        transactionId: refId,
        source: 'WITHDRAWAL_REQUEST_DEBIT',
        auditInfo: `Requested withdrawal of ₹${amount} (Fee ₹${fee}) to ${bAcc.bankName} ${bAcc.accountNumberMasked}`,
        createdAt: new Date().toISOString(),
      });

      // Withdrawal record
      const wdlRef = doc(collection(db, 'withdrawals'));
      t.set(wdlRef, {
        userId,
        userEmail: userProfile.email,
        amount,
        fee,
        finalAmount: amount,
        bankAccountId,
        bankAccountMasked: bAcc.accountNumberMasked,
        referenceId: refId,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });

      // Transaction log
      const txRef = doc(collection(db, 'transactions'));
      t.set(txRef, {
        userId,
        type: 'Withdrawal',
        amount: totalRequired,
        currency: 'INR',
        fee,
        status: 'Pending',
        referenceId: refId,
        previousBalance: currentW.inrBalance,
        newBalance: newBal,
        createdAt: new Date().toISOString(),
      });
    });

    await logAuditEvent(userId, 'WITHDRAWAL_REQUESTED', 'Withdrawal', refId, `Requested withdrawal of ₹${amount} to ${bAcc.bankName} ${bAcc.accountNumberMasked}`);
    await notifyAdmin(`New Bank Withdrawal Requested`, 'WITHDRAWAL_REQUESTED', {
      userId: userProfile.userIdCode,
      transactionId: refId,
      amount,
      currency: 'INR',
      status: 'Pending',
      maskedBankInfo: `${bAcc.bankName} (${bAcc.accountNumberMasked}) - IFSC: ${bAcc.ifscCode}`,
    });

    return {
      id: refId,
      userId,
      userEmail: userProfile.email,
      amount,
      fee,
      finalAmount: amount,
      bankAccountId,
      bankAccountMasked: bAcc.accountNumberMasked,
      referenceId: refId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
  };

  // Bank Account Management
  const addBankAccount = async (data: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'accountNumberMasked'> & { fullAccountNumber: string }) => {
    if (!userId) throw new Error('Authentication required');
    const accNum = data.fullAccountNumber.replace(/\s+/g, '');
    if (accNum.length < 9 || accNum.length > 18) {
      throw new Error('Invalid account number length (9 to 18 digits)');
    }
    const masked = `******${accNum.slice(-4)}`;

    // If marked primary or first account, ensure others aren't primary
    const isFirst = bankAccounts.length === 0;
    const isPrimary = data.isPrimary || isFirst;

    const newDoc = {
      userId,
      accountHolderName: data.accountHolderName.trim(),
      bankName: data.bankName.trim(),
      accountNumberMasked: masked,
      accountNumberEncrypted: `ENC_${btoa(accNum)}`, // simulated encryption at rest
      ifscCode: data.ifscCode.toUpperCase().trim(),
      accountType: data.accountType,
      nickname: data.nickname?.trim() || `${data.bankName} Account`,
      isPrimary,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'bank_accounts'), newDoc);

    await logAuditEvent(userId, 'BANK_ACCOUNT_ADDED', 'BankAccount', docRef.id, `Added bank account: ${data.bankName} (${masked})`);
    await notifyAdmin(`Bank Account Added`, 'BANK_ACCOUNT_ADDED', {
      userId: userProfile?.userIdCode || userId,
      maskedBankInfo: `${data.bankName} (${masked})`,
      status: 'Verified',
    });
  };

  const editBankAccount = async (id: string, data: Partial<BankAccount>) => {
    if (!userId) throw new Error('Authentication required');
    const docRef = doc(db, 'bank_accounts', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Bank account not found');
    if (snap.data().userId !== userId && !isAdmin) throw new Error('Unauthorized');

    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    await logAuditEvent(userId, 'BANK_ACCOUNT_UPDATED', 'BankAccount', id, `Updated account ${id}`);
    await notifyAdmin(`Bank Account Updated`, 'BANK_ACCOUNT_CHANGED', {
      userId: userProfile?.userIdCode || userId,
      status: 'Updated',
    });
  };

  const deleteBankAccount = async (id: string) => {
    if (!userId) throw new Error('Authentication required');
    const docRef = doc(db, 'bank_accounts', id);
    await deleteDoc(docRef);
    await logAuditEvent(userId, 'BANK_ACCOUNT_DELETED', 'BankAccount', id, `Deleted bank account ${id}`);
  };

  const setPrimaryBankAccount = async (id: string) => {
    if (!userId) throw new Error('Authentication required');
    // Set all others to false
    for (const b of bankAccounts) {
      if (b.id !== id && b.isPrimary) {
        await updateDoc(doc(db, 'bank_accounts', b.id), { isPrimary: false });
      }
    }
    await updateDoc(doc(db, 'bank_accounts', id), { isPrimary: true, updatedAt: new Date().toISOString() });
    await logAuditEvent(userId, 'PRIMARY_BANK_CHANGED', 'BankAccount', id, `Set account ${id} as primary`);
  };

  // ADMIN ACTION: Verify Payment & Credit Balance Atomically
  const verifyPayment = async (paymentId: string, customNote = 'Verified by administrator') => {
    if (!isAdmin) throw new Error('Admin privileges required to verify payments');

    const paymentRef = doc(db, 'payments', paymentId);
    let targetUserId = '';
    let creditAmount = 0;
    let paymentCurrency: 'INR' | 'USDT_TRC20' | 'USDT_BEP20' = 'INR';
    let pRefId = '';

    await runTransaction(db, async (t) => {
      const pSnap = await t.get(paymentRef);
      if (!pSnap.exists()) throw new Error('Payment record not found');

      const pData = pSnap.data() as PaymentRequest;
      if (pData.status === 'Verified') {
        throw new Error('This payment has already been verified and credited!');
      }

      targetUserId = pData.userId;
      creditAmount = pData.amount;
      paymentCurrency = pData.currency;
      pRefId = pData.referenceId;

      // 1. Mark payment as verified
      t.update(paymentRef, {
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: userProfile?.email || 'admin',
        updatedAt: new Date().toISOString(),
      });

      // 2. Read target user's wallet
      const walletRef = doc(db, 'wallets', targetUserId);
      const wSnap = await t.get(walletRef);
      if (!wSnap.exists()) throw new Error('Target user wallet not found');

      const curW = wSnap.data() as WalletData;
      let prevBalance = 0;
      let newBalance = 0;
      let walletUpdate: Partial<WalletData> = {};

      if (paymentCurrency === 'INR') {
        prevBalance = curW.inrBalance || 0;
        newBalance = prevBalance + creditAmount;
        walletUpdate = { inrBalance: newBalance, updatedAt: new Date().toISOString() };
      } else if (paymentCurrency === 'USDT_TRC20') {
        prevBalance = curW.usdtBalance || 0;
        newBalance = prevBalance + creditAmount;
        walletUpdate = { usdtBalance: newBalance, updatedAt: new Date().toISOString() };
      } else {
        prevBalance = curW.usdtBep20Balance || 0;
        newBalance = prevBalance + creditAmount;
        walletUpdate = { usdtBep20Balance: newBalance, updatedAt: new Date().toISOString() };
      }

      // 3. Update wallet balance
      t.update(walletRef, walletUpdate);

      // 4. Create Ledger Entry
      const ledgerRef = doc(collection(db, 'wallet_ledger'));
      t.set(ledgerRef, {
        userId: targetUserId,
        currency: paymentCurrency,
        type: 'credit',
        amount: creditAmount,
        previousBalance: prevBalance,
        newBalance: newBalance,
        transactionId: pRefId,
        source: 'PAYMENT_VERIFICATION_CREDIT',
        auditInfo: `Verified payment ${pRefId} (${customNote})`,
        createdAt: new Date().toISOString(),
      });

      // 5. Create Transaction record
      const txRef = doc(collection(db, 'transactions'));
      t.set(txRef, {
        userId: targetUserId,
        type: 'Deposit',
        amount: creditAmount,
        currency: paymentCurrency,
        fee: 0,
        status: 'Completed',
        referenceId: pRefId,
        previousBalance: prevBalance,
        newBalance: newBalance,
        createdAt: new Date().toISOString(),
      });
    });

    // 6. Audit & Notifications
    await logAuditEvent(
      userProfile?.uid || 'admin',
      'PAYMENT_VERIFIED',
      'PaymentRequest',
      paymentId,
      `Payment ${pRefId} verified. Credited ${paymentCurrency} ${creditAmount} to user ${targetUserId}`
    );

    // Notify User
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    const userEmail = userDoc.exists() ? userDoc.data().email : '';
    if (userEmail) {
      await sendEmailNotification({
        recipientEmail: userEmail,
        subject: `Payment Verified - ${paymentCurrency} ${creditAmount} Credited to Your Wallet!`,
        type: 'PAYMENT_VERIFIED',
        userId: targetUserId,
        paymentId: pRefId,
        amount: creditAmount,
        currency: paymentCurrency,
        status: 'Verified',
        date: new Date().toISOString(),
        additionalDetails: 'Your wallet balance has been updated in real-time.',
      });
    }

    // Notify Admin
    await notifyAdmin(`Payment ${pRefId} Successfully Verified`, 'PAYMENT_VERIFIED', {
      userId: targetUserId,
      paymentId: pRefId,
      amount: creditAmount,
      currency: paymentCurrency,
      status: 'Verified',
      additionalDetails: `Credited by ${userProfile?.email}`,
    });
  };

  // ADMIN ACTION: Reject Payment
  const rejectPayment = async (paymentId: string, reason: string) => {
    if (!isAdmin) throw new Error('Admin privileges required');
    const paymentRef = doc(db, 'payments', paymentId);
    const snap = await getDoc(paymentRef);
    if (!snap.exists()) throw new Error('Payment not found');

    const pData = snap.data() as PaymentRequest;
    if (pData.status === 'Verified') {
      throw new Error('Cannot reject an already verified payment');
    }

    const now = new Date().toISOString();
    await updateDoc(paymentRef, {
      status: 'Rejected',
      rejectionReason: reason,
      updatedAt: now,
    });

    await logAuditEvent(
      userProfile?.uid || 'admin',
      'PAYMENT_REJECTED',
      'PaymentRequest',
      paymentId,
      `Rejected payment ${pData.referenceId}: ${reason}`
    );

    await notifyAdmin(`Payment ${pData.referenceId} Rejected`, 'PAYMENT_REJECTED', {
      userId: pData.userId,
      paymentId: pData.referenceId,
      amount: pData.amount,
      currency: pData.currency,
      status: 'Rejected',
      additionalDetails: `Reason: ${reason}`,
    });

    // Notify User
    if (pData.userEmail) {
      await sendEmailNotification({
        recipientEmail: pData.userEmail,
        subject: `Payment Verification Update - ${pData.referenceId} Rejected`,
        type: 'PAYMENT_REJECTED',
        userId: pData.userId,
        paymentId: pData.referenceId,
        amount: pData.amount,
        currency: pData.currency,
        status: 'Rejected',
        date: now,
        additionalDetails: `Reason: ${reason}`,
      });
    }
  };

  // ADMIN ACTION: Process Withdrawal (Approve or Reject)
  const processWithdrawal = async (
    withdrawalId: string,
    action: 'Approve' | 'Reject',
    rejectionReason?: string
  ) => {
    if (!isAdmin) throw new Error('Admin privileges required');
    const wdlRef = doc(db, 'withdrawals', withdrawalId);
    const snap = await getDoc(wdlRef);
    if (!snap.exists()) throw new Error('Withdrawal not found');

    const wData = snap.data() as WithdrawalRecord;
    if (wData.status === 'Completed' || wData.status === 'Rejected') {
      throw new Error(`Withdrawal is already in terminal state: ${wData.status}`);
    }

    if (action === 'Approve') {
      const now = new Date().toISOString();
      await updateDoc(wdlRef, {
        status: 'Completed',
        processedAt: now,
        updatedAt: now,
      });

      // Update transaction status
      const qTx = query(collection(db, 'transactions'), where('referenceId', '==', wData.referenceId));
      const txSnap = await getDocs(qTx);
      txSnap.forEach(async (d) => {
        await updateDoc(d.ref, { status: 'Completed' });
      });

      await logAuditEvent(userProfile?.uid || 'admin', 'WITHDRAWAL_COMPLETED', 'Withdrawal', withdrawalId, `Approved ₹${wData.amount} bank transfer`);
      await notifyAdmin(`Bank Withdrawal Completed`, 'WITHDRAWAL_COMPLETED', {
        userId: wData.userId,
        transactionId: wData.referenceId,
        amount: wData.amount,
        currency: 'INR',
        status: 'Completed',
        maskedBankInfo: wData.bankAccountMasked,
      });

      if (wData.userEmail) {
        await sendEmailNotification({
          recipientEmail: wData.userEmail,
          subject: `Withdrawal Successful - ₹${wData.amount} Sent to Your Bank Account`,
          type: 'WITHDRAWAL_COMPLETED',
          userId: wData.userId,
          transactionId: wData.referenceId,
          amount: wData.amount,
          currency: 'INR',
          status: 'Completed',
          date: now,
          maskedBankInfo: wData.bankAccountMasked,
        });
      }
    } else {
      // Reject withdrawal: Refund amount + fee to user's INR balance atomically
      const refundAmount = wData.amount + wData.fee;
      await runTransaction(db, async (t) => {
        const walletRef = doc(db, 'wallets', wData.userId);
        const curWSnap = await t.get(walletRef);
        if (!curWSnap.exists()) throw new Error('Wallet not found');

        const curW = curWSnap.data() as WalletData;
        const prevBal = curW.inrBalance;
        const newBal = prevBal + refundAmount;

        t.update(walletRef, {
          inrBalance: newBal,
          updatedAt: new Date().toISOString(),
        });

        t.update(wdlRef, {
          status: 'Rejected',
          rejectionReason: rejectionReason || 'Bank account invalid or mismatch',
          updatedAt: new Date().toISOString(),
        });

        // Ledger refund entry
        const ledgerRef = doc(collection(db, 'wallet_ledger'));
        t.set(ledgerRef, {
          userId: wData.userId,
          currency: 'INR',
          type: 'credit',
          amount: refundAmount,
          previousBalance: prevBal,
          newBalance: newBal,
          transactionId: `REF-${wData.referenceId}`,
          source: 'WITHDRAWAL_REJECTED_REFUND',
          auditInfo: `Refund for rejected withdrawal ${wData.referenceId} (${rejectionReason || 'Rejected by Admin'})`,
          createdAt: new Date().toISOString(),
        });

        // Transaction record
        const txRef = doc(collection(db, 'transactions'));
        t.set(txRef, {
          userId: wData.userId,
          type: 'Refund',
          amount: refundAmount,
          currency: 'INR',
          fee: 0,
          status: 'Completed',
          referenceId: `REF-${wData.referenceId}`,
          previousBalance: prevBal,
          newBalance: newBal,
          createdAt: new Date().toISOString(),
        });
      });

      await logAuditEvent(userProfile?.uid || 'admin', 'WITHDRAWAL_REJECTED', 'Withdrawal', withdrawalId, `Rejected withdrawal ${wData.referenceId}: ${rejectionReason}`);
      await notifyAdmin(`Withdrawal Rejected & Refunded`, 'WITHDRAWAL_REJECTED', {
        userId: wData.userId,
        transactionId: wData.referenceId,
        amount: wData.amount,
        currency: 'INR',
        status: 'Rejected',
        additionalDetails: `Reason: ${rejectionReason}`,
      });
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        ledgerEntries,
        bankAccounts,
        paymentRequests,
        deposits,
        transfers,
        sellOrders,
        withdrawals,
        transactions,
        referrals,
        auditLogs,
        emailLogs,
        allUsersList,
        allPayments,
        allWithdrawals,
        loading,
        conversionRateUsdtInr,
        createPaymentRequest,
        uploadPaymentProof,
        createDepositRecord,
        transferUsdt,
        sellUsdt,
        requestWithdrawal,
        addBankAccount,
        editBankAccount,
        deleteBankAccount,
        setPrimaryBankAccount,
        verifyPayment,
        rejectPayment,
        processWithdrawal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};
