import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCustomer } from '../services/customerService';
import { getCustomerTransactions, addKhataTransaction } from '../services/transactionService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { shareViaWhatsApp } from '../utils/share';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { ArrowLeft, MessageCircle, Phone, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function KhataCustomerPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('give'); // 'give' or 'take'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, txData] = await Promise.all([
          getCustomer(customerId),
          getCustomerTransactions(customerId)
        ]);
        setCustomer(customerData);
        setTransactions(txData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  const handleTransaction = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    setSubmitting(true);
    try {
      const createdBy = { uid: user.uid, name: userData?.displayName || 'Staff' };
      
      await addKhataTransaction(customerId, {
        amount: numAmount,
        type: transactionType,
        description
      }, createdBy);
      
      // Refresh
      const [customerData, txData] = await Promise.all([
        getCustomer(customerId),
        getCustomerTransactions(customerId)
      ]);
      setCustomer(customerData);
      setTransactions(txData);
      
      setShowTransactionModal(false);
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error('Transaction failed:', err);
      alert('Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppReminder = () => {
    if (!customer.phone) {
      alert('Customer does not have a phone number saved.');
      return;
    }
    
    let text = '';
    if (customer.khataBalance > 0) {
      text = `Dear ${customer.name}, your pending balance at Madhan Mohan & Sons is ${formatCurrency(customer.khataBalance)}. Please arrange for payment. Thank you!`;
    } else {
      text = `Dear ${customer.name}, you have an advance balance of ${formatCurrency(Math.abs(customer.khataBalance))} at Madhan Mohan & Sons.`;
    }
    
    shareViaWhatsApp(customer.phone, text);
  };

  if (loading) return <FullPageSpinner />;
  if (!customer) return <p className="text-center py-20">Customer not found.</p>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shrink-0">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{customer.name || 'Unnamed Customer'}</h1>
            {(customer.normalizedMobile || customer.phone) && (
              <p className="text-sm text-slate-500">
                {(customer.normalizedMobile && customer.normalizedMobile !== '+') ? customer.normalizedMobile : customer.phone}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {customer.phone && (
              <>
                <Button variant="outline" size="sm" onClick={() => window.open(`tel:${customer.phone}`)} className="px-3">
                  <Phone size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={handleWhatsAppReminder} className="px-3">
                  <MessageCircle size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Balance Card */}
        <div className={`mt-4 p-4 rounded-xl flex items-center justify-between ${
          customer.khataBalance > 0 ? 'bg-red-50 text-red-900' :
          customer.khataBalance < 0 ? 'bg-emerald-50 text-emerald-900' :
          'bg-slate-50 text-slate-900'
        }`}>
          <div>
            <p className="text-sm font-medium opacity-80">Net Balance</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(Math.abs(customer.khataBalance || 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">
              {customer.khataBalance > 0 ? 'You will receive' :
               customer.khataBalance < 0 ? 'You will pay' :
               'Settled'}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md">
          <h2 className="font-semibold text-slate-900">Ledger Details</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No transactions yet. Add a transaction below.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex gap-4">
                <div className="shrink-0 mt-1">
                  {tx.type === 'give' ? (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <ArrowUpRight size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ArrowDownLeft size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {tx.type === 'give' ? 'You Gave' : 'You Got'}
                    {tx.description && <span className="text-slate-500 font-normal ml-2">({tx.description})</span>}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(tx.createdAt)}</p>
                  {tx.refId && (
                    <button onClick={() => navigate(`/invoices/${tx.refId}`)} className="text-xs text-indigo-600 font-medium hover:underline mt-1">
                      View Bill
                    </button>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${tx.type === 'give' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Bal: {formatCurrency(Math.abs(tx.balanceAfter))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 shrink-0 pb-2">
        <Button 
          variant="danger" 
          size="lg" 
          className="!rounded-2xl shadow-sm"
          onClick={() => { setTransactionType('give'); setShowTransactionModal(true); }}
        >
          You Gave ₹ (Red)
        </Button>
        <Button 
          variant="success" 
          size="lg" 
          className="!rounded-2xl shadow-sm"
          onClick={() => { setTransactionType('take'); setShowTransactionModal(true); }}
        >
          You Got ₹ (Green)
        </Button>
      </div>

      {/* Transaction Modal */}
      <Modal 
        isOpen={showTransactionModal} 
        onClose={() => setShowTransactionModal(false)}
        title={transactionType === 'give' ? 'You Gave' : 'You Got'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full text-2xl font-bold p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Bill details</label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. advance payment, goods on credit"
            />
          </div>
          <Button 
            fullWidth 
            onClick={handleTransaction} 
            loading={submitting}
            disabled={!amount || parseFloat(amount) <= 0}
            variant={transactionType === 'give' ? 'danger' : 'success'}
          >
            Save Transaction
          </Button>
        </div>
      </Modal>
    </div>
  );
}
