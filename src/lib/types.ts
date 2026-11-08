export type Currency = 'INR' | 'USDT_TRC20' | 'USDT_BEP20';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  userIdCode: string;
  referralCode: string;
  referredBy?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WalletData {
  id: string;
  userId: string;
  inrBalance: number;
  usdtBalance: number;       // USDT TRC20
  usdtBep20Balance: number;  // USDT BEP20
  levelIncome: number;
  ltdIncome: number;
  totalIncome: number;
  updatedAt: string;
}

export type LedgerEntryType = 'credit' | 'debit';

export interface LedgerEntry {
  id: string;
  userId: string;
  currency: Currency;
  type: LedgerEntryType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  transactionId: string;
  source: string;
  auditInfo: string;
  createdAt: string;
}

export type AccountType = 'savings' | 'current';

export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  accountNumberEncrypted?: string;
  ifscCode: string;
  accountType: AccountType;
  nickname?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentStatus = 'Pending' | 'Under Review' | 'Verified' | 'Rejected' | 'Expired';
export type PaymentMethod = 'UPI' | 'IMPS' | 'NEFT' | 'USDT_TRC20' | 'USDT_BEP20';

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  referenceId: string;
  status: PaymentStatus;
  proofUrl?: string;
  proofFileName?: string;
  proofFileType?: string;
  proofFileSize?: number;
  uploadedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CryptoNetwork = 'TRC20' | 'BEP20';
export type DepositStatus = 'Pending' | 'Confirmed' | 'Failed' | 'Expired';

export interface DepositRecord {
  id: string;
  userId: string;
  depositId: string;
  network: CryptoNetwork;
  walletAddress: string;
  amount: number;
  txHash?: string;
  status: DepositStatus;
  createdAt: string;
  updatedAt?: string;
}

export type TransferStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface TransferRecord {
  id: string;
  userId: string;
  recipientAddress: string;
  network: CryptoNetwork;
  amount: number;
  fee: number;
  finalAmount: number;
  referenceId: string;
  status: TransferStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SellOrderRecord {
  id: string;
  userId: string;
  usdtAmount: number;
  rate: number;
  inrAmount: number;
  fee: number;
  bankAccountId: string;
  bankAccountMasked: string;
  referenceId: string;
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: string;
}

export type WithdrawalStatus = 'Pending' | 'Processing' | 'Completed' | 'Rejected';

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  fee: number;
  finalAmount: number;
  bankAccountId: string;
  bankAccountMasked: string;
  referenceId: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TransactionType =
  | 'Deposit'
  | 'Transfer'
  | 'Sell'
  | 'Withdrawal'
  | 'Bank Transfer'
  | 'Payment'
  | 'Refund';

export type TransactionStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Rejected';

export interface TransactionRecord {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  fee: number;
  status: TransactionStatus;
  referenceId: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserEmail: string;
  level: number;
  commissionEarned: number;
  status: 'Active' | 'Pending';
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface EmailNotificationRecord {
  id: string;
  recipientEmail: string;
  subject: string;
  type: string;
  payload: Record<string, unknown> | string;
  status: 'Sent' | 'Delivered' | 'Queued';
  createdAt: string;
}
