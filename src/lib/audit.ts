import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase.ts';

export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}
