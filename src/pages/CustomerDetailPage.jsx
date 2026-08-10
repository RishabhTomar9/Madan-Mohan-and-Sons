import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomer, updateCustomer, normalizeMobile } from '../services/customerService';
import { getCustomerInvoices } from '../services/invoiceService';
import { formatCurrency } from '../utils/currency';
import { ArrowLeft, Phone, MapPin, Mail, BookOpen, ReceiptText, User, Edit2, ChevronRight } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editKhataEnabled, setEditKhataEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [custData, invData] = await Promise.all([
          getCustomer(id),
          getCustomerInvoices(id)
        ]);
        setCustomer(custData);
        setInvoices(invData);
        
        // Populate edit state
        if (custData) {
          setEditName(custData.name || '');
          setEditPhone(custData.phone || '');
          setEditEmail(custData.email || '');
          setEditAddress(custData.address || '');
          setEditCity(custData.city || '');
          setEditKhataEnabled(!!custData.khataEnabled);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates = {
        name: editName,
        phone: editPhone,
        email: editEmail,
        address: editAddress,
        city: editCity,
        khataEnabled: editKhataEnabled,
      };
      await updateCustomer(id, updates);
      
      // Update local state
      setCustomer({ 
        ...customer, 
        ...updates,
        normalizedMobile: normalizeMobile(editPhone) 
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update customer:', err);
      alert('Failed to update customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!customer) return <div className="p-8 text-center">Customer not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 flex flex-col items-center border-b border-slate-200 relative">
          
          <button 
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 p-2 text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-full transition-colors shadow-sm"
            aria-label="Edit Profile"
          >
            <Edit2 size={18} />
          </button>

          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold shadow-inner ring-4 ring-white mb-4">
            {(customer.name && customer.name !== 'Unnamed Customer') ? customer.name[0]?.toUpperCase() : <User size={32} />}
          </div>
          
          {/* Name */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">
            {customer.name || 'Unnamed Customer'}
          </h2>
          
          {/* Details (Mobile/Location/Email) */}
          <div className="flex flex-col items-center gap-1.5 text-sm text-slate-600 mb-6">
            {(customer.phone || customer.normalizedMobile) && customer.normalizedMobile !== '+' && (
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400"/> 
                {customer.normalizedMobile || customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400"/> 
                {customer.email}
              </p>
            )}
            {customer.address && (
              <p className="flex items-center gap-2 text-center">
                <MapPin size={14} className="text-slate-400 shrink-0"/> 
                {customer.address} {customer.city ? `, ${customer.city}` : ''}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="w-full sm:w-auto">
            {customer.khataEnabled ? (
              <Button 
                onClick={() => navigate(`/khatabook/${customer.id}`)} 
                icon={BookOpen}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
              >
                Open Khata Ledger
              </Button>
            ) : (
              <p className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">Khata Disabled</p>
            )}
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-500">Khata Balance</p>
            <p className={`text-xl font-bold mt-1 ${customer.khataBalance > 0 ? 'text-orange-600' : customer.khataBalance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatCurrency(Math.abs(customer.khataBalance || 0))}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-500">Total Purchases</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(customer.totalPurchases || 0)}</p>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <ReceiptText size={20} className="text-slate-400" />
            Recent Bills
          </h3>
          
          {invoices.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed text-slate-500 text-sm">
              No bills found for this customer.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Link to={`/invoices/${inv.id}`} key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(inv.createdAt?.toMillis ? inv.createdAt.toMillis() : Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${inv.paymentMethod === 'khata' ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {inv.paymentMethod}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer Profile">
        <form onSubmit={handleUpdate} className="space-y-4 mt-4">
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Input
            label="Mobile Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <Input
            label="Email (Optional)"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <Input
            label="Address (Optional)"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
          />
          <Input
            label="City (Optional)"
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="khataEnabled"
              checked={editKhataEnabled}
              onChange={(e) => setEditKhataEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="khataEnabled" className="text-sm font-medium text-slate-700">
              Enable Khata for this customer
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
