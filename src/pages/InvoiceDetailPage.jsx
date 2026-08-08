import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, cancelInvoice } from '../services/invoiceService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FullPageSpinner } from '../components/ui/Spinner';
import { ArrowLeft, Printer, Download, Share2, XCircle } from 'lucide-react';
import { SHOP_INFO } from '../utils/constants';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getInvoice(id);
        setInvoice(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelInvoice(id);
      setInvoice((prev) => ({ ...prev, status: 'cancelled' }));
      setShowCancel(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!invoice) return <p className="text-center py-20 text-slate-500">Invoice not found.</p>;

  const statusMap = { paid: 'success', pending: 'warning', cancelled: 'danger' };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Invoice Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{SHOP_INFO.name}</h1>
              <p className="text-sm text-slate-500 mt-1">{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-400">{formatDateTime(invoice.createdAt)}</p>
            </div>
            <Badge variant={statusMap[invoice.status]}>{invoice.status}</Badge>
          </div>
        </div>

        {/* Customer */}
        {invoice.customer && (
          <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50">
            <p className="text-xs text-slate-400">Customer</p>
            <p className="text-sm font-medium text-slate-900">{invoice.customer.name}</p>
            {invoice.customer.phone && <p className="text-xs text-slate-500">{invoice.customer.phone}</p>}
          </div>
        )}

        {/* Items */}
        <div className="divide-y divide-slate-50">
          {invoice.items?.map((item, i) => (
            <div key={i} className="px-6 py-3 flex justify-between">
              <div>
                <p className="text-sm text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.quantity} × {formatCurrency(item.rate)}</p>
              </div>
              <p className="text-sm font-medium text-slate-900">{formatCurrency(item.total)}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-1.5">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          {invoice.discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatCurrency(invoice.discountAmount)}</span></div>}
          {invoice.taxAmount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">{invoice.taxType} ({invoice.taxRate}%)</span><span>+{formatCurrency(invoice.taxAmount)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200"><span>Total</span><span>{formatCurrency(invoice.grandTotal)}</span></div>
          <p className="text-xs text-slate-500 capitalize">Paid via {invoice.paymentMethod}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>Print</Button>
        <Button variant="outline" size="sm" icon={Download}>Download</Button>
        <Button variant="outline" size="sm" icon={Share2} onClick={() => {
          const text = `Invoice ${invoice.invoiceNumber}\nTotal: ${formatCurrency(invoice.grandTotal)}\n\nThank you for shopping at ${SHOP_INFO.name}!`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }}>WhatsApp</Button>
        {invoice.status !== 'cancelled' && (
          <Button variant="danger" size="sm" icon={XCircle} onClick={() => setShowCancel(true)}>Cancel Invoice</Button>
        )}
      </div>

      <ConfirmDialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice ${invoice.invoiceNumber}? This cannot be undone.`}
        confirmText="Cancel Invoice"
        loading={cancelling}
      />
    </div>
  );
}
