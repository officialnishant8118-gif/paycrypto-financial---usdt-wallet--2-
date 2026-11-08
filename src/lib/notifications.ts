import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase.ts';
import { handleFirestoreError, OperationType } from './errorHandler.ts';

export const ADMIN_NOTIFICATION_EMAIL = 'Jonk58065@gmail.com';

export interface EmailDispatchPayload {
  recipientEmail: string;
  subject: string;
  type: string;
  userId: string;
  transactionId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  status: string;
  date: string;
  maskedBankInfo?: string;
  additionalDetails?: string;
}

export async function sendEmailNotification(payload: EmailDispatchPayload): Promise<void> {
  // Sanitize payload: NEVER allow pin, cvv, otp, or private key
  const sanitizedPayload = {
    userId: payload.userId,
    transactionId: payload.transactionId || payload.paymentId || 'N/A',
    amount: payload.amount !== undefined ? payload.amount : 'N/A',
    currency: payload.currency || 'N/A',
    status: payload.status,
    date: payload.date || new Date().toISOString(),
    maskedBankInfo: payload.maskedBankInfo || undefined,
    additionalDetails: payload.additionalDetails || undefined,
  };

  const emailDoc = {
    recipientEmail: payload.recipientEmail,
    subject: payload.subject,
    type: payload.type,
    payload: JSON.stringify(sanitizedPayload, null, 2),
    status: 'Sent',
    createdAt: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'email_notifications'), emailDoc);
  } catch (error) {
    console.error('Failed to save email notification to Firestore:', error);
    // Even if logging fails, do not crash app flow
  }

  // Also log to console for auditing
  console.log(`[SMTP Dispatcher -> ${payload.recipientEmail}] ${payload.subject}:`, sanitizedPayload);
}

export async function notifyAdmin(subject: string, type: string, details: Partial<EmailDispatchPayload>): Promise<void> {
  return sendEmailNotification({
    recipientEmail: ADMIN_NOTIFICATION_EMAIL,
    subject: `[PayCrypto Admin Alert] ${subject}`,
    type,
    userId: details.userId || 'System',
    transactionId: details.transactionId,
    paymentId: details.paymentId,
    amount: details.amount,
    currency: details.currency,
    status: details.status || 'Alert',
    date: new Date().toISOString(),
    maskedBankInfo: details.maskedBankInfo,
    additionalDetails: details.additionalDetails,
  });
}
