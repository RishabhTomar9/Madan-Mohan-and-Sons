import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, User, X, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, addMoney, multiplyMoney, calculateDiscount, calculateTax } from '../utils/currency';
import { PAYMENT_METHODS, TAX_TYPES } from '../utils/constants';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import BottomSheet from '../components/ui/BottomSheet';
import { createInvoice } from '../services/invoiceService';
import { searchCustomers, quickCreateCustomer } from '../services/customerService';

const KEYPAD_KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', 'C'],
];

export default function BillingPage() {
  const { user, userData } = useAuth();

  // Input state
  const [quantity, setQuantity] = useState('1');
  const [amount, setAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [activeField, setActiveField] = useState('amount'); // 'quantity' | 'amount' | 'name'

  // Bill state
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null); // null = walk-in
  const [discount, setDiscount] = useState({ value: 0, type: 'fixed' });
  const [taxRate, setTaxRate] = useState(0);
  const [taxType, setTaxType] = useState('GST');

  // UI state
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  const nameInputRef = useRef(null);
  const amountInputRef = useRef(null);

  // Calculations
  const subtotal = items.reduce((sum, item) => addMoney(sum, multiplyMoney(item.quantity, item.rate)), 0);
  const discountAmount = calculateDiscount(subtotal, discount.value, discount.type);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateTax(taxableAmount, taxRate);
  const grandTotal = addMoney(taxableAmount, taxAmount);

  // Keypad handler
  const handleKeypad = useCallback((key) => {
    const field = activeField === 'quantity' ? quantity : amount;
    const setter = activeField === 'quantity' ? setQuantity : setAmount;

    if (key === 'C') {
      setter('');
      return;
    }

    if (key === '.' && field.includes('.')) return;

    setter((prev) => prev + key);
  }, [activeField, quantity, amount]);

  // Add item to bill
  const addItem = useCallback(() => {
    const qty = parseFloat(quantity) || 1;
    const rate = parseFloat(amount) || 0;
    const name = productName.trim() || 'Item';

    if (rate <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        quantity: qty,
        rate,
        total: multiplyMoney(qty, rate),
      },
    ]);

    // Reset for next item
    setQuantity('1');
    setAmount('');
    setProductName('');
    setActiveField('amount');
    amountInputRef.current?.focus();
  }, [quantity, amount, productName]);

  // Remove item
  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture when typing in inputs (except specific shortcuts)
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      if (e.key === 'Escape') {
        setQuantity('1');
        setAmount('');
        setProductName('');
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        if (amount && productName) {
          e.preventDefault();
          addItem();
        }
        return;
      }

      if (e.key === '+' && !isInputFocused) {
        e.preventDefault();
        addItem();
        return;
      }

      // Tab between fields
      if (e.key === 'Tab' && !e.shiftKey) {
        if (activeField === 'quantity') {
          e.preventDefault();
          setActiveField('amount');
          amountInputRef.current?.focus();
        } else if (activeField === 'amount') {
          e.preventDefault();
          setActiveField('name');
          nameInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addItem, activeField, amount, productName]);

  // Generate bill
  const handleGenerateBill = async (paymentMethod, splitPayments = null) => {
    if (items.length === 0) return;

    setGenerating(true);
    try {
      const invoiceData = {
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total,
        })),
        customer: customer || { name: 'Walk-in Customer' },
        subtotal,
        discountAmount,
        discountType: discount.type,
        discountValue: discount.value,
        taxRate,
        taxType,
        taxAmount,
        grandTotal,
        paymentMethod: splitPayments ? 'split' : paymentMethod,
        splitPayments,
        status: paymentMethod === 'credit' ? 'pending' : 'paid',
        createdBy: {
          uid: user.uid,
          name: userData?.displayName || 'Staff',
        },
      };

      const invoice = await createInvoice(invoiceData);
      setLastInvoice(invoice);

      // Reset
      setItems([]);
      setCustomer(null);
      setDiscount({ value: 0, type: 'fixed' });
      setShowPayment(false);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert('Failed to generate bill. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomer(true)}
            icon={User}
          >
            <span className="hidden sm:inline">
              {customer ? customer.name : 'Walk-in'}
            </span>
          </Button>
        </div>
      </div>

      {/* Main billing area — split layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Calculator / Input */}
        <div className="space-y-4">
          {/* Input fields */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            {/* Quantity + Amount row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onFocus={() => setActiveField('quantity')}
                  className={`w-full rounded-xl border px-3 py-3 text-center text-lg font-bold
                    transition-colors ${activeField === 'quantity'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                      : 'border-slate-200 bg-white'
                    }`}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Amount (₹)</label>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => setActiveField('amount')}
                  placeholder="0"
                  className={`w-full rounded-xl border px-3 py-3 text-lg font-bold
                    transition-colors ${activeField === 'amount'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                      : 'border-slate-200 bg-white'
                    }`}
                />
              </div>
            </div>

            {/* Product name */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Product Name</label>
              <input
                ref={nameInputRef}
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onFocus={() => setActiveField('name')}
                placeholder="Enter product name"
                className={`w-full rounded-xl border px-3 py-3 text-sm
                  transition-colors ${activeField === 'name'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                    : 'border-slate-200 bg-white'
                  }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
            </div>

            {/* Add Item button */}
            <Button
              onClick={addItem}
              fullWidth
              size="lg"
              icon={Plus}
              disabled={!amount || parseFloat(amount) <= 0}
              className="!rounded-xl"
            >
              Add Item
            </Button>
          </div>

          {/* Keypad — hidden on mobile if keyboard visible, always shown on tablet+ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.flat().map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleKeypad(key)}
                  className={`
                    h-14 sm:h-16 rounded-xl text-xl font-semibold
                    transition-colors active:bg-slate-200
                    ${key === 'C'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }
                  `}
                >
                  {key}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Current Bill */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col max-h-[60vh] lg:max-h-[calc(100vh-200px)]">
            {/* Bill header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Current Bill</h2>
              <p className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-slate-400">
                  Add items to start billing
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group"
                  >
                    <span className="text-xs text-slate-400 w-6">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {formatCurrency(item.rate)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 shrink-0">
                      {formatCurrency(item.total)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50
                                 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <div className="border-t border-slate-200 px-4 py-3 space-y-2 bg-slate-50/50">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{taxType} ({taxRate}%)</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscount(true)}
            >
              Discount
            </Button>
            <div className="flex-1" />
            <Button
              size="lg"
              onClick={() => setShowPayment(true)}
              disabled={items.length === 0}
              className="min-w-[160px] !rounded-xl"
            >
              Generate Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={grandTotal}
        onConfirm={handleGenerateBill}
        loading={generating}
        customerHasKhata={!!customer}
      />

      {/* Customer Selector */}
      <CustomerSelectorModal
        isOpen={showCustomer}
        onClose={() => setShowCustomer(false)}
        onSelect={setCustomer}
        selected={customer}
      />

      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscount}
        onClose={() => setShowDiscount(false)}
        discount={discount}
        onApply={setDiscount}
        taxRate={taxRate}
        taxType={taxType}
        onTaxChange={(rate, type) => { setTaxRate(rate); setTaxType(type); }}
      />

      {/* Success Modal */}
      {lastInvoice && (
        <InvoiceSuccessModal
          invoice={lastInvoice}
          onClose={() => setLastInvoice(null)}
          onNewBill={() => setLastInvoice(null)}
        />
      )}
    </div>
  );
}

// ---------- Payment Modal ----------
function PaymentModal({ isOpen, onClose, total, onConfirm, loading, customerHasKhata }) {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState([]);

  const handleConfirm = () => {
    if (splitMode && splits.length > 0) {
      onConfirm('split', splits);
    } else {
      onConfirm(selectedMethod);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment" size="sm">
      <div className="space-y-4">
        <div className="text-center py-2">
          <p className="text-sm text-slate-500">Amount Due</p>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`
                p-3 rounded-xl border text-sm font-medium transition-all text-left
                ${selectedMethod === method.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {method.label}
            </button>
          ))}
        </div>

        <Button
          onClick={handleConfirm}
          fullWidth
          size="lg"
          loading={loading}
          className="!rounded-xl"
        >
          Confirm Payment
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Customer Selector Modal ----------
function CustomerSelectorModal({ isOpen, onClose, onSelect, selected }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const customers = await searchCustomers(query);
      setResults(customers);
    } catch (err) {
      console.error('Customer search failed:', err);
    }
  };

  const handleQuickCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const customer = await quickCreateCustomer(newName.trim(), newPhone.trim());
      onSelect(customer);
      setShowCreate(false);
      onClose();
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer" size="sm">
      <div className="space-y-4">
        {/* Walk-in option */}
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className={`w-full p-3 rounded-xl border text-left text-sm transition-all
            ${!selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <p className="font-medium">Walk-in Customer</p>
          <p className="text-xs opacity-70">No customer details required</p>
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c); onClose(); }}
                className="w-full p-2.5 rounded-lg text-left text-sm hover:bg-slate-50 transition-colors"
              >
                <p className="font-medium text-slate-900">{c.name}</p>
                {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
              </button>
            ))}
          </div>
        )}

        {/* Quick create */}
        {!showCreate ? (
          <Button variant="ghost" size="sm" fullWidth onClick={() => setShowCreate(true)} icon={Plus}>
            New Customer
          </Button>
        ) : (
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
            <Input placeholder="Customer Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Phone (optional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={handleQuickCreate} loading={creating}>Save & Select</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Discount & Tax Modal ----------
function DiscountModal({ isOpen, onClose, discount, onApply, taxRate, taxType, onTaxChange }) {
  const [value, setValue] = useState(discount.value.toString());
  const [type, setType] = useState(discount.type);
  const [rate, setRate] = useState(taxRate.toString());
  const [tType, setTType] = useState(taxType);

  const handleApply = () => {
    onApply({ value: parseFloat(value) || 0, type });
    onTaxChange(parseFloat(rate) || 0, tType);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Discount & Tax" size="sm">
      <div className="space-y-4">
        {/* Discount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="fixed">₹ Fixed</option>
              <option value="percentage">% Percent</option>
            </select>
          </div>
        </div>

        {/* Tax */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <select
              value={tType}
              onChange={(e) => setTType(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:border-indigo-500 focus:outline-none"
            >
              {TAX_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={handleApply} fullWidth>Apply</Button>
      </div>
    </Modal>
  );
}

// ---------- Invoice Success Modal ----------
function InvoiceSuccessModal({ invoice, onClose, onNewBill }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Bill Created ✓" size="sm">
      <div className="space-y-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
        >
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <div>
          <p className="font-semibold text-slate-900">Invoice #{invoice.invoiceNumber}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(invoice.grandTotal)}</p>
          <p className="text-sm text-slate-500 capitalize mt-1">{invoice.paymentMethod}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
          <Button variant="outline" onClick={() => {/* PDF logic */}}>Download</Button>
          <Button variant="outline" onClick={() => {
            const text = `Invoice ${invoice.invoiceNumber}\nTotal: ${formatCurrency(invoice.grandTotal)}\nThank you for shopping at Madhan Mohan & Sons!`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
          }}>WhatsApp</Button>
          <Button onClick={onNewBill}>New Bill</Button>
        </div>
      </div>
    </Modal>
  );
}
