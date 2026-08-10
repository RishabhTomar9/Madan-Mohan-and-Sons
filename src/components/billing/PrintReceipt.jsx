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
    <div className="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto print:p-8 print:max-w-none print:w-full print:bg-white relative border-t-8 border-slate-900 shadow-sm print:shadow-none print:border-t-0">
      
      {/* ----------------- WATERMARK ----------------- */}
      {logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] print:opacity-[0.06] z-0 overflow-hidden">
          <img src={logoUrl} alt="Watermark" className="w-[80%] max-w-2xl object-contain grayscale" />
        </div>
      )}

      <div className="relative z-10">

      {/* ----------------- BRANDING HEADER ----------------- */}
      <div className="flex flex-col items-center justify-center text-center border-b-2 border-slate-900 pb-2 mb-2">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-2">
          {logoUrl && (
            <img src={logoUrl} alt={shopName} className="h-16 sm:h-20 w-auto object-contain print:h-24 drop-shadow-sm" />
          )}
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            {shopName}
          </h1>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 text-sm sm:text-base text-slate-700 font-medium max-w-2xl mx-auto">
          {shopAddress && <p className="w-full sm:w-auto text-center">{shopAddress}</p>}
          
          {(shopPhone || shopGstin) && (
            <div className="hidden sm:block text-slate-300">|</div>
          )}
          
          {shopPhone && (
            <p><span className="font-bold text-slate-900">Ph:</span> {shopPhone}</p>
          )}

          {shopPhone && shopGstin && (
            <div className="hidden sm:block text-slate-300">|</div>
          )}

          {shopGstin && (
            <p><span className="font-bold text-slate-900">GSTIN:</span> {shopGstin}</p>
          )}
        </div>
      </div>

      {/* ----------------- CUSTOMER DETAILS ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Billed To Box */}
        <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200">
          <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Billed To</h3>
          <p className="font-black text-slate-900 text-lg uppercase">{invoice.customer?.name || 'Walk-in Customer'}</p>
          {invoice.customer && (invoice.customer.normalizedMobile || invoice.customer.phone) && (
            <p className="text-sm text-slate-700 mt-2">
              <span className="font-semibold text-slate-500">Phone:</span> {(invoice.customer.normalizedMobile && invoice.customer.normalizedMobile !== '+') ? invoice.customer.normalizedMobile : invoice.customer.phone}
            </p>
          )}
          {invoice.customer?.email && (
            <p className="text-sm text-slate-700 mt-1">
              <span className="font-semibold text-slate-500">Email:</span> {invoice.customer.email}
            </p>
          )}
          {invoice.customer?.address && (
            <p className="text-sm text-slate-700 mt-1"><span className="font-semibold text-slate-500">Address:</span> {invoice.customer.address}</p>
          )}
        </div>

        {/* Invoice Details Box */}
        <div className="p-5 bg-indigo-50/30 rounded-xl border border-indigo-100 flex flex-col justify-center sm:items-end text-left sm:text-right">
          <h2 className="text-2xl font-black text-indigo-600 uppercase tracking-widest mb-4">Tax Invoice</h2>
          <div className="text-sm text-slate-700 space-y-1.5 w-full sm:w-auto">
            <div className="flex justify-between sm:justify-end gap-4"><span className="font-semibold text-slate-500">Invoice No:</span> <span className="font-black text-slate-900">{invoice.invoiceNumber}</span></div>
            <div className="flex justify-between sm:justify-end gap-4"><span className="font-semibold text-slate-500">Date:</span> <span className="font-medium text-slate-800">{new Date(invoice.createdAt?.toMillis ? invoice.createdAt.toMillis() : Date.now()).toLocaleDateString('en-IN')}</span></div>
            <div className="flex justify-between sm:justify-end gap-4"><span className="font-semibold text-slate-500">Time:</span> <span className="font-medium text-slate-800">{new Date(invoice.createdAt?.toMillis ? invoice.createdAt.toMillis() : Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="flex justify-between sm:justify-end gap-4"><span className="font-semibold text-slate-500">Pay Mode:</span> <span className="uppercase font-black text-slate-900">{invoice.paymentMethod}</span></div>
          </div>
        </div>
      </div>

      {/* ----------------- ITEMS TABLE ----------------- */}
      <div className="mb-6">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-4 py-3 font-semibold w-12 text-center rounded-tl-lg">#</th>
              <th className="px-4 py-3 font-semibold">Item Description</th>
              <th className="px-4 py-3 font-semibold text-center w-24">Qty</th>
              <th className="px-4 py-3 font-semibold text-right w-32">Rate</th>
              <th className="px-4 py-3 font-semibold text-right w-32 rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200 rounded-b-lg">
            {invoice.items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-center text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-3 text-center text-slate-700">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ----------------- TOTALS ----------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
        <div className="w-full sm:w-1/2 pt-4">
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-50 hidden print:block">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">Payment Instructions</h4>
            {storeSettings?.upiId ? (
              <p className="text-sm text-slate-700">UPI ID: <span className="font-bold">{storeSettings.upiId}</span></p>
            ) : (
              <p className="text-sm text-slate-700">Please make all cheques payable to <span className="font-bold">{shopName}</span>.</p>
            )}
          </div>
        </div>
        
        <div className="w-full sm:w-80">
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between py-1">
                <span>{invoice.taxType} ({invoice.taxRate}%)</span>
                <span className="font-semibold text-slate-900">+{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            {invoice.additionalCharges?.map((c, i) => {
              const amt = parseFloat(c.amount) || 0;
              if (!c.name && amt === 0) return null;
              return (
                <div key={i} className="flex justify-between py-1">
                  <span>{c.name || 'Additional Charge'}</span>
                  <span className="font-semibold text-slate-900">+{formatCurrency(amt)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-slate-900 rounded-xl flex justify-between items-center text-white">
            <span className="font-bold uppercase tracking-widest text-sm">Total</span>
            <span className="text-2xl font-black">{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ----------------- FOOTER & QR ----------------- */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-8 print:flex hidden pt-8 border-t border-slate-200">
        
        <div className="flex items-center gap-6">
          {storeSettings?.upiId && (
            <div className="flex flex-col items-center">
              <div className="p-2 border-2 border-slate-900 rounded-xl bg-white shadow-sm mb-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${storeSettings.upiId}&pn=${encodeURIComponent(shopName)}&am=${invoice.grandTotal}&cu=INR`)}`}
                  alt="Scan to Pay"
                  className="w-20 h-20"
                  crossOrigin="anonymous"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Scan to Pay</p>
            </div>
          )}
          
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-800 text-sm mb-2">Terms & Conditions</p>
            <p>1. Goods once sold will not be returned or exchanged.</p>
            <p>2. Subject to Rewa (M.P) Jurisdiction.</p>
            <p className="mt-4 font-semibold text-indigo-600">Thank you for your business!</p>
          </div>
        </div>

        {/* ----------------- SIGNATURE & SEAL ----------------- */}
        <div className="flex gap-8">
          <div className="text-center">
            <div className="w-32 border-b-2 border-slate-400 mb-2"></div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Customer Signature</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b-2 border-slate-400 mb-2"></div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Authorized Signatory</p>
            <p className="text-[9px] text-slate-400 mt-1">For {shopName}</p>
          </div>
        </div>

      </div>

      </div>
    </div>
  );
}
