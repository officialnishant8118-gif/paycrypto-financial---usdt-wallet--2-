import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Upload,
  Receipt,
  FileCheck,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye,
  Trash2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { PaymentMethod, Currency, PaymentRequest } from '../lib/types.ts';

const COMPANY_PAYMENT_DETAILS = {
  upiId: 'paycrypto.settle@icici',
  accountHolder: 'PayCrypto Global Settlements Pvt Ltd',
  bankName: 'ICICI Bank',
  accountNumber: '002105018942',
  ifscCode: 'ICIC0000021',
  branch: 'BKC Financial Center, Mumbai',
};

export const PaymentRequestScreen: React.FC = () => {
  const { paymentRequests, createPaymentRequest, uploadPaymentProof } = useWallet();

  const [step, setStep] = useState<'create' | 'proof'>('create');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [activePayment, setActivePayment] = useState<PaymentRequest | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopy = (text: string, type: 'upi' | 'acc') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerNotice(null);
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 100) {
      setBannerNotice({ type: 'error', message: 'Minimum deposit amount is ₹100.' });
      return;
    }

    try {
      const created = await createPaymentRequest(parsedAmount, currency, paymentMethod);
      setActivePayment(created);
      setStep('proof');
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Failed to create payment request.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Supported formats: JPG, JPEG, PNG, WebP, PDF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported format. Allowed formats: JPG, JPEG, PNG, WebP, PDF.');
      return;
    }

    // Size check: Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File is too large. Maximum file size allowed is 5 MB.');
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!activePayment || !selectedFile) {
      setUploadError('Please select a payment screenshot to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 25 : prev));
    }, 200);

    try {
      // Convert file to Base64 for persistent Firestore storage
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Url = reader.result as string;
        clearInterval(interval);
        setUploadProgress(100);

        await uploadPaymentProof(
          activePayment.id,
          base64Url,
          selectedFile.name,
          selectedFile.type,
          selectedFile.size
        );

        setIsUploading(false);
        setBannerNotice({
          type: 'success',
          message: 'Payment proof uploaded successfully! Our compliance team will verify and credit your wallet.',
        });
        setSelectedFile(null);
        setFilePreview(null);
        setStep('create');
        setAmount('');
        setActivePayment(null);
        setTimeout(() => setBannerNotice(null), 8000);
      };
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setUploadError(err.message || 'Upload failed');
    }
  };

  const upiIntentString = `upi://pay?pa=${COMPANY_PAYMENT_DETAILS.upiId}&pn=PayCrypto&am=${activePayment?.amount || amount}&cu=INR`;

  return (
    <div className="space-y-6">
      {bannerNotice && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          bannerNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {bannerNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{bannerNotice.message}</span>
        </div>
      )}

      {step === 'create' ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Initiate INR / Fiat Deposit</h3>
            <p className="text-xs text-slate-500">Generate a unique deposit reference ID and pay via UPI or Bank IMPS/NEFT</p>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-5">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Deposit Amount (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-base">
                  ₹
                </span>
                <input
                  type="number"
                  min="100"
                  step="1"
                  required
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono tabular-nums text-lg font-bold text-slate-900 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[1000, 2000, 5000, 10000, 25000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick.toString())}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-mono tabular-nums"
                  >
                    +₹{quick.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'UPI', label: 'Instant UPI', desc: 'GPay, PhonePe, Paytm, BHIM' },
                  { id: 'IMPS', label: 'Bank IMPS', desc: 'Instant 24x7 Account Transfer' },
                  { id: 'NEFT', label: 'NEFT / RTGS', desc: 'Large Volume Bank Settlement' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                      paymentMethod === m.id
                        ? 'border-cyan-600 bg-cyan-50/50 text-cyan-950 font-bold'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">{m.label}</span>
                    <span className="block text-[11px] text-slate-500 font-normal">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Continue to Payment Instructions & Proof Upload
            </button>
          </form>
        </div>
      ) : (
        /* Step 2: Payment Instructions & Proof Upload */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-800 block mb-1">
                Reference: {activePayment?.referenceId}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                Deposit Amount: ₹{activePayment?.amount?.toLocaleString('en-IN')}
              </h3>
            </div>
            <button
              onClick={() => setStep('create')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel / Back
            </button>
          </div>

          {/* Instructions Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* UPI QR */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                <QRCodeSVG value={upiIntentString} size={150} level="M" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 mt-2 font-mono tabular-nums">
                Scan & Pay ₹{activePayment?.amount}
              </span>
              <span className="text-[10px] text-slate-400">BHIM UPI / GooglePay / PhonePe</span>
            </div>

            {/* Bank & UPI Details */}
            <div className="md:col-span-8 space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Company Official UPI ID</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{COMPANY_PAYMENT_DETAILS.upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(COMPANY_PAYMENT_DETAILS.upiId, 'upi')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-cyan-700 hover:bg-cyan-50 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800">Bank Transfer (IMPS / NEFT) Details:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Beneficiary Name</span>
                    <strong className="text-slate-800">{COMPANY_PAYMENT_DETAILS.accountHolder}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bank Name</span>
                    <strong className="text-slate-800">{COMPANY_PAYMENT_DETAILS.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Number</span>
                    <strong className="text-slate-800 font-mono tabular-nums">{COMPANY_PAYMENT_DETAILS.accountNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                    <strong className="text-slate-800 font-mono">{COMPANY_PAYMENT_DETAILS.ifscCode}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL FINANCIAL WARNING */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-950">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-900">Verification Requirement:</p>
              <p className="leading-relaxed">
                Uploading a screenshot alone <strong className="font-bold">does not</strong> automatically increase your balance.
                An administrator cross-references your bank UTR against incoming bank statements.
                Only verified payments create a ledger balance credit.
              </p>
            </div>
          </div>

          {/* Screenshot Upload Dropzone */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-600" /> Upload Payment Screenshot / Receipt Proof
            </h4>

            {!selectedFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">Click to upload or drag & drop payment screenshot</p>
                <p className="text-[11px] text-slate-400 mt-1">Supported formats: JPG, JPEG, PNG, WebP, PDF (Max 5MB)</p>
              </label>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Proof Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-xs"
                      onClick={() => setPreviewModalImg(filePreview)}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                      PDF
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                    </p>
                    {filePreview && (
                      <button
                        type="button"
                        onClick={() => setPreviewModalImg(filePreview)}
                        className="text-[11px] text-cyan-700 font-semibold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> View Preview
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-mono tabular-nums">
                  <span>Uploading payment proof...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUploadSubmit}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Proof for Verification'}
            </button>
          </div>
        </div>
      )}

      {/* Payment History Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-cyan-600" /> Your Payment & Deposit Requests
        </h3>

        {paymentRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No payment requests created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pl-2">Payment ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Proof Screenshot</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentRequests.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-2 font-mono tabular-nums font-bold text-slate-800">{p.referenceId}</td>
                    <td className="py-3 font-mono tabular-nums font-bold text-slate-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3 font-medium text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3">
                      {p.proofUrl ? (
                        <button
                          onClick={() => setPreviewModalImg(p.proofUrl || null)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:underline cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" /> View Uploaded
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-medium">Pending Upload</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'Verified' ? 'bg-emerald-500' : p.status === 'Under Review' ? 'bg-sky-500' : p.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <span className={
                          p.status === 'Verified' ? 'text-emerald-700 font-semibold' : p.status === 'Under Review' ? 'text-sky-700' : p.status === 'Rejected' ? 'text-rose-700' : 'text-amber-700'
                        }>
                          {p.status}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right font-mono tabular-nums text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl p-3 overflow-hidden shadow-2xl">
            <img
              src={previewModalImg}
              alt="Payment Screenshot"
              className="max-h-[75vh] w-auto rounded-xl object-contain mx-auto"
            />
            <div className="p-3 text-center">
              <button
                onClick={() => setPreviewModalImg(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
