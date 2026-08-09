import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';

export default function PrintReceipt({ invoice, storeSettings }) {
  if (!invoice) return null;

  const shopName = storeSettings ? storeSettings.name : 'Madan MOHAN & SONS';
  const shopAddress = storeSettings ? storeSettings.address : 'Main Market, Delhi 110001';
  const shopPhone = storeSettings ? storeSettings.phone : '+91 98765 43210';
  const shopGstin = storeSettings ? storeSettings.gstin : '07AABCU9603R1ZM';
  const logoUrl = storeSettings ? storeSettings.logoUrl : '/applogo.png';

  return (
    <div className="bg-white text-slate-900 font-sans p-6 sm:p-8 max-w-3xl mx-auto print:p-8 print:max-w-none print:w-full print:bg-white">

      {/* ----------------- BRANDING HEADER ----------------- */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
            {shopName}
          </h1>
          {shopAddress && <p className="text-sm text-slate-600 mt-1">{shopAddress}</p>}
          {(shopGstin || shopPhone) && (
            <p className="text-sm text-slate-600 mt-0.5">
              {shopGstin && <span className="font-medium">GSTIN {shopGstin}</span>}
              {shopGstin && shopPhone && <span className="mx-2">•</span>}
              {shopPhone && <span>{shopPhone}</span>}
            </p>
          )}
        </div>

        {logoUrl && (
          <div className="shrink-0 flex items-start print:items-end">
            <img src={logoUrl} alt={shopName} className="h-16 w-auto object-contain" />
          </div>
        )}
      </div>

      {/* ----------------- INVOICE INFO ----------------- */}
      <div className="mb-6">
        <div className="flex flex-col gap-1.5 text-sm text-slate-700">
          <p className="flex items-center flex-wrap gap-x-2">
            <span className="font-bold">{invoice.invoiceNumber}</span>
            <span className="text-slate-300">•</span>
            <span>
              {new Date(invoice.createdAt?.toMillis ? invoice.createdAt.toMillis() : Date.now()).toLocaleString('en-IN', {
                day: 'numeric', month: 'numeric', year: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
              }).replace(',', '')}
            </span>
            <span className="text-slate-300">•</span>
            <span className="capitalize">{invoice.paymentMethod}</span>
          </p>
          <p>
            <span className="text-slate-500 mr-1">Bill to:</span>
            <span className="font-medium">{invoice.customer?.name || 'Walk-in'}</span>
            {invoice.customer && (invoice.customer.normalizedMobile || invoice.customer.phone) && (
              <span className="ml-1 text-slate-500">({(invoice.customer.normalizedMobile && invoice.customer.normalizedMobile !== '+') ? invoice.customer.normalizedMobile : invoice.customer.phone})</span>
            )}
          </p>
        </div>
      </div>

      {/* ----------------- ITEMS TABLE ----------------- */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-600 tracking-wider">
            <tr>
              <th className="px-4 py-3 w-16">QTY</th>
              <th className="px-4 py-3">ITEM</th>
              <th className="px-4 py-3 text-right">RATE</th>
              <th className="px-4 py-3 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-semibold text-slate-900">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-700">{item.name}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ----------------- TOTALS ----------------- */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="pt-4 flex flex-col items-end gap-1.5 text-sm text-slate-600 px-4 pb-4">
          <div className="w-full sm:w-64 flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="w-full sm:w-64 flex justify-between">
              <span>Discount</span>
              <span className="font-medium text-slate-900">-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="w-full sm:w-64 flex justify-between">
              <span>{invoice.taxType} ({invoice.taxRate}%)</span>
              <span className="font-medium text-slate-900">+{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}
          {invoice.additionalCharges?.map((c, i) => {
            const amt = parseFloat(c.amount) || 0;
            if (!c.name && amt === 0) return null;
            return (
              <div key={i} className="w-full sm:w-64 flex justify-between">
                <span>{c.name || 'Additional Charge'}</span>
                <span className="font-medium text-slate-900">+{formatCurrency(amt)}</span>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-200">
          <span className="font-extrabold text-slate-900 uppercase tracking-widest text-sm">GRAND TOTAL</span>
          <span className="text-2xl font-bold text-indigo-600 tracking-tight">{formatCurrency(invoice.grandTotal)}</span>
        </div>
      </div>

      {/* ----------------- FOOTER & QR ----------------- */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:flex hidden">
        {/* QR Code */}
        {storeSettings?.upiId ? (
          <div className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl bg-white shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${storeSettings.upiId}&pn=${encodeURIComponent(shopName)}&am=${invoice.grandTotal}&cu=INR`)}`}
              alt="Scan to Pay"
              className="w-20 h-20 mb-2"
              crossOrigin="anonymous"
            />
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Scan to Pay</p>
          </div>
        ) : <div />}

        {/* Footer Text */}
        <div className="text-center sm:text-right text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 text-sm">Thank you for your business!</p>
          <p>Goods once sold will not be returned or exchanged.</p>
          <p>Subject to Delhi Jurisdiction.</p>
        </div>
      </div>

    </div>
  );
}
