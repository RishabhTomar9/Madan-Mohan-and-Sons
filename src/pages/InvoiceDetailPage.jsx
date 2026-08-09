import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, cancelInvoice } from '../services/invoiceService';
import { getStoreSettings } from '../services/settingsService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FullPageSpinner } from '../components/ui/Spinner';
import { ArrowLeft, Printer, Download, Share2, XCircle } from 'lucide-react';
import PrintReceipt from '../components/billing/PrintReceipt';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [data, settings] = await Promise.all([
          getInvoice(id),
          getStoreSettings()
        ]);
        setInvoice(data);
        setStoreSettings(settings);
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

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      
      {/* ----------------- WEB UI ACTIONS (Hidden on Print) ----------------- */}
      <div className="flex items-center justify-between print:hidden mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          {invoice.status === 'cancelled' && (
            <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider">Cancelled</span>
          )}
          {invoice.status !== 'cancelled' && (
            <Button variant="danger" size="sm" icon={XCircle} onClick={() => setShowCancel(true)} className="hidden sm:flex">
              Cancel
            </Button>
          )}
          <Button variant="outline" size="sm" icon={Share2} onClick={() => {
            const text = `Invoice ${invoice.invoiceNumber}\nTotal: ${formatCurrency(invoice.grandTotal)}\n\nThank you for shopping with us!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          }}>
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {/* ----------------- INVOICE / RECEIPT DISPLAY ----------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:shadow-none print:border-none print:rounded-none print:block print-only">
        {/* We reuse the exact same PrintReceipt component here so the user gets the identical layout they requested for both viewing and printing! */}
        <PrintReceipt invoice={invoice} storeSettings={storeSettings} />
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
