import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Info, Check, Printer, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, addMoney, multiplyMoney, calculateDiscount, calculateTax } from '../utils/currency';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import { createInvoice } from '../services/invoiceService';
import { getCustomers, updateCustomer } from '../services/customerService';
import { getStoreSettings } from '../services/settingsService';
import { getProducts } from '../services/productService';
import UnifiedCustomerSearch from '../components/billing/UnifiedCustomerSearch';
import PrintReceipt from '../components/billing/PrintReceipt';

const KEYPAD_KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', 'C'],
];

export default function BillingPage() {
  const { user, userData } = useAuth();
  const [storeSettings, setStoreSettings] = useState(null);

  // Customer State
  const [customer, setCustomer] = useState(null);

  // Input state
  const [quantity, setQuantity] = useState('1');
  const [amount, setAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [activeField, setActiveField] = useState('amount');

  // Bill state
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState({ value: 0, type: 'fixed' });
  const [taxRate, setTaxRate] = useState(0);
  const [taxType, setTaxType] = useState('GST');
  const [additionalCharges, setAdditionalCharges] = useState([]);

  // UI state
  const [showPayment, setShowPayment] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  // Product Search state
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    getProducts().then(setAllProducts).catch(console.error);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productName.trim().length >= 2) {
        const filtered = allProducts.filter(p => 
          p.name.toLowerCase().includes(productName.toLowerCase()) || 
          (p.barcode && p.barcode.includes(productName))
        );
        setProductSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setProductSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [productName, allProducts]);

  const nameInputRef = useRef(null);
  const amountInputRef = useRef(null);

  // Calculations
  const subtotal = items.reduce((sum, item) => addMoney(sum, multiplyMoney(item.quantity, item.rate)), 0);
  const discountAmount = calculateDiscount(subtotal, discount.value, discount.type);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateTax(taxableAmount, taxRate);
  
  const additionalChargesTotal = additionalCharges.reduce((sum, charge) => addMoney(sum, parseFloat(charge.amount) || 0), 0);
  const grandTotal = addMoney(addMoney(taxableAmount, taxAmount), additionalChargesTotal);

  // Keypad handler
  const handleKeypad = useCallback((key) => {
    if (!customer) return; // Prevent typing if no customer

    const field = activeField === 'quantity' ? quantity : amount;
    const setter = activeField === 'quantity' ? setQuantity : setAmount;

    if (key === 'C') {
      setter('');
      return;
    }

    if (key === '.' && field.includes('.')) return;

    setter((prev) => prev + key);
  }, [activeField, quantity, amount, customer]);

  // Add item to bill
  const addItem = useCallback(() => {
    if (!customer) return;

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

    setQuantity('1');
    setAmount('');
    setProductName('');
    setActiveField('amount');
    amountInputRef.current?.focus();
  }, [quantity, amount, productName, customer]);

  // Remove item
  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!customer) return;

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
  }, [addItem, activeField, amount, productName, customer]);

  // Generate bill
  const handleGenerateBill = async (paymentMethod, additionalData = {}) => {
    if (items.length === 0 || !customer) return;

    setGenerating(true);
    try {
      const invoiceData = {
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total,
        })),
        customer: customer,
        subtotal,
        discountAmount,
        discountType: discount.type,
        discountValue: discount.value,
        taxRate,
        taxType,
        taxAmount,
        additionalCharges, // Add to invoice data
        grandTotal,
        paymentMethod: paymentMethod, // 'cash', 'upi', 'khata'
        status: paymentMethod === 'khata' ? 'credit' : 'paid',
        cashReceived: additionalData.cashReceived || 0,
        changeAmount: additionalData.changeAmount || 0,
        createdBy: {
          uid: user.uid,
          name: userData?.displayName || 'Staff',
        },
      };

      const invoice = await createInvoice(invoiceData);
      setLastInvoice(invoice);

      if (paymentMethod === 'khata' && customer?.id) {
        try {
          await updateCustomer(customer.id, { khataEnabled: true });
        } catch (updateErr) {
          console.error('Failed to auto-enable Khata for customer:', updateErr);
        }
      }

      // Reset
      setItems([]);
      setCustomer(null);
      setDiscount({ value: 0, type: 'fixed' });
      setTaxRate(0);
      setTaxType('GST');
      setAdditionalCharges([]);
      setShowPayment(false);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert('Failed to generate bill. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const clearCustomer = () => {
    if (items.length > 0) {
      if (!window.confirm("Change customer? Current items will remain in the bill.")) {
        return;
      }
    }
    setCustomer(null);
  };

  const [recentCustomers, setRecentCustomers] = useState([]);

  // Fetch recent customers on mount
  useEffect(() => {
    getCustomers().then(setRecentCustomers).catch(console.error);
    getStoreSettings().then(setStoreSettings).catch(console.error);
  }, []);

  return (
    <div className="pb-24 lg:pb-0 h-[calc(100vh-4rem)] flex flex-col">
      {/* Step 1: Customer Selection */}
      <div className="shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 hidden md:block">1. Select Customer</h1>
        <UnifiedCustomerSearch 
          onCustomerSelected={setCustomer}
          selectedCustomer={customer}
          onClear={clearCustomer}
        />
      </div>

      {/* Step 2: Billing Area */}
      <AnimatePresence>
        {!customer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 flex-1 overflow-y-auto"
          >
            <div className="flex items-center justify-center p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl border-dashed mx-2 sm:mx-0">
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-800 text-sm sm:text-base">No Customer Selected</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-[250px] mx-auto">Please search or select a customer below to start billing.</p>
              </div>
            </div>

            {/* Recent Customers List */}
            {recentCustomers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mx-2 sm:mx-0">
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-2 sm:mb-3">Recent Customers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {recentCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCustomer(c)}
                      className="text-left p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{c.name || 'Unnamed Customer'}</p>
                        <p className="text-[11px] sm:text-xs text-slate-500">{(c.normalizedMobile && c.normalizedMobile !== '+') ? c.normalizedMobile : c.phone}</p>
                      </div>
                      {c.khataBalance !== 0 && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full whitespace-nowrap">
                          Khata: {formatCurrency(Math.abs(c.khataBalance))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {customer && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 flex-1 lg:overflow-hidden"
        >
          {/* LEFT: Calculator / Input */}
          <div className="flex flex-col gap-3 lg:overflow-y-auto">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 hidden md:block">2. Add Items</h2>
            <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-3 lg:p-4 space-y-2.5 shadow-sm">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">Qty</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onFocus={() => setActiveField('quantity')}
                    className={`w-full rounded-lg sm:rounded-xl border px-2 sm:px-3 py-2 sm:py-3 text-center text-base sm:text-lg font-bold
                      transition-colors ${activeField === 'quantity'
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                        : 'border-slate-200 bg-white'
                      }`}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">Amount (₹)</label>
                  <input
                    ref={amountInputRef}
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onFocus={() => setActiveField('amount')}
                    placeholder="0"
                    className={`w-full rounded-lg sm:rounded-xl border px-2 sm:px-3 py-2 sm:py-3 text-base sm:text-lg font-bold
                      transition-colors ${activeField === 'amount'
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                        : 'border-slate-200 bg-white'
                      }`}
                  />
                </div>
              </div>

              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setActiveField('name')}
                  placeholder="Product Name (Optional)"
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 sm:py-3 text-xs sm:text-sm
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
                
                <AnimatePresence>
                  {showSuggestions && productSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                    >
                      {productSuggestions.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex justify-between items-center"
                          onClick={() => {
                            setProductName(prod.name);
                            if (prod.price) setAmount(prod.price.toString());
                            setShowSuggestions(false);
                            amountInputRef.current?.focus();
                            setActiveField('amount');
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">{prod.name}</p>
                            <p className="text-[10px] text-slate-500">{prod.stockQuantity} in stock</p>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">{formatCurrency(prod.price)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={addItem}
                fullWidth
                size="md"
                icon={Plus}
                disabled={!amount || parseFloat(amount) <= 0}
                className="!rounded-lg sm:!rounded-xl py-2.5 sm:py-3 bg-indigo-500 hover:bg-indigo-600 border-none"
              >
                Add Item
              </Button>
            </div>

            {/* Keypad */}
            <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-2 sm:p-3 shadow-sm flex-1 lg:flex-none flex flex-col justify-center">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 h-full">
                {KEYPAD_KEYS.flat().map((key) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleKeypad(key)}
                    className={`
                      h-12 sm:h-14 lg:h-16 rounded-lg sm:rounded-xl text-lg sm:text-xl font-semibold
                      transition-colors active:bg-slate-200 flex items-center justify-center
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
          <div className="flex flex-col gap-3 lg:overflow-y-auto mb-20 lg:mb-0">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 hidden lg:block">Current Bill</h2>
            <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 flex flex-col max-h-[50vh] lg:max-h-none lg:flex-1 shadow-sm">
              {/* Bill header */}
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl lg:rounded-t-2xl shrink-0">
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Current Bill</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                {customer && (
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 truncate max-w-[100px] sm:max-w-[150px]">{customer.name}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">{(customer.normalizedMobile && customer.normalizedMobile !== '+') ? customer.normalizedMobile : customer.phone}</p>
                    {customer.email && <p className="text-[10px] sm:text-xs text-slate-400">{customer.email}</p>}
                  </div>
                )}
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 min-h-[100px]">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs sm:text-sm text-slate-400 py-8">
                    Add items to start billing
                  </div>
                ) : (
                  items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-slate-50 group"
                    >
                      <span className="text-[10px] sm:text-xs text-slate-400 w-4 sm:w-6">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          {item.quantity} × {formatCurrency(item.rate)}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">
                        {formatCurrency(item.total)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50
                                   opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Summary */}
              <div className="border-t border-slate-200 px-3 py-2 sm:px-4 sm:py-3 space-y-1.5 sm:space-y-2 bg-slate-50/50 shrink-0">
                <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                    <span>{taxType} ({taxRate}%)</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                {additionalCharges.map((c, i) => {
                  const amt = parseFloat(c.amount) || 0;
                  if (!c.name && amt === 0) return null;
                  return (
                    <div key={i} className="flex justify-between text-xs sm:text-sm text-indigo-600">
                      <span>{c.name || 'Additional Charge'}</span>
                      <span>+{formatCurrency(amt)}</span>
                    </div>
                  );
                })}

                <div className="flex justify-between text-base sm:text-xl font-bold text-slate-900 pt-1.5 sm:pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Actions (Hidden on mobile, replaced by floating bar) */}
            <div className="hidden lg:flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscount(true)}
              >
                Discount / Tax
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCharge(true)}
              >
                + Add Charge
              </Button>
              <div className="flex-1" />
              <Button
                size="lg"
                onClick={() => setShowPayment(true)}
                disabled={items.length === 0}
                className="min-w-[160px] !rounded-xl"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating Action Bar for Mobile */}
      {customer && (
        <div className="fixed bottom-14 left-0 right-0 p-3 bg-white border-t border-slate-200 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] lg:hidden flex justify-between items-center z-40 pb-safe">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{items.length} Items</span>
            <span className="text-xl font-bold text-slate-900 leading-none mt-0.5">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCharge(true)}
              className="px-2"
              title="Add Charge"
            >
              +
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscount(true)}
              className="px-2"
            >
              %
            </Button>
            <Button 
              size="lg" 
              onClick={() => setShowPayment(true)} 
              disabled={items.length === 0}
              className="px-6 rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700"
            >
              Pay Now
            </Button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={grandTotal}
        onConfirm={handleGenerateBill}
        loading={generating}
        customer={customer}
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

      {/* Additional Charges Modal */}
      <AdditionalChargesModal
        isOpen={showAddCharge}
        onClose={() => setShowAddCharge(false)}
        charges={additionalCharges}
        onApply={setAdditionalCharges}
      />

      {/* Success Modal + Print Trigger */}
      {lastInvoice && (
        <>
          <InvoiceSuccessModal
            invoice={lastInvoice}
            storeSettings={storeSettings}
            onClose={() => setLastInvoice(null)}
            onNewBill={() => setLastInvoice(null)}
          />
          {/* Hidden Print Receipt component that only shows during window.print() */}
          <div className="hidden print:block print-only bg-white z-[9999]">
            <PrintReceipt invoice={lastInvoice} storeSettings={storeSettings} />
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Unified Payment Modal ----------
function PaymentModal({ isOpen, onClose, total, onConfirm, loading, customer }) {
  // Methods: 'cash', 'upi', 'khata'
  const [method, setMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  
  // Auto-focus cash input if cash is selected
  const cashInputRef = useRef(null);
  useEffect(() => {
    if (isOpen && method === 'cash') {
      setTimeout(() => cashInputRef.current?.focus(), 100);
    }
  }, [isOpen, method]);

  const cashVal = parseFloat(cashReceived) || 0;
  const change = cashVal - total;
  const isCashInsufficient = method === 'cash' && cashVal < total;

  const handleConfirm = () => {
    if (method === 'cash' && isCashInsufficient) return;
    
    if (method === 'cash') {
      onConfirm('cash', { cashReceived: cashVal, changeAmount: change });
    } else {
      onConfirm(method);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="space-y-6">
        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Grand Total</p>
          <p className="text-4xl font-bold text-slate-900 mt-1">{formatCurrency(total)}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMethod('cash')}
            className={`p-3 rounded-xl border font-medium transition-all text-center flex flex-col items-center gap-1
              ${method === 'cash' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
            `}
          >
            <span className="text-2xl">💵</span>
            Cash
          </button>
          <button
            onClick={() => setMethod('upi')}
            className={`p-3 rounded-xl border font-medium transition-all text-center flex flex-col items-center gap-1
              ${method === 'upi' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
            `}
          >
            <span className="text-2xl">📱</span>
            UPI
          </button>
          <button
            onClick={() => setMethod('khata')}
            className={`p-3 rounded-xl border font-medium transition-all text-center flex flex-col items-center gap-1
              ${method === 'khata' ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
            `}
          >
            <span className="text-2xl">📒</span>
            Khata
          </button>
        </div>

        <div className="min-h-[140px]">
          {/* CASH UI */}
          {method === 'cash' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cash Received (₹)</label>
                <div className="flex gap-2">
                  <input
                    ref={cashInputRef}
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Enter amount given by customer"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setCashReceived(total.toString())}
                    className="shrink-0"
                  >
                    Exact
                  </Button>
                </div>
              </div>
              
              {cashReceived && !isCashInsufficient && (
                <div className="flex justify-between items-center p-3 bg-green-50 text-green-800 rounded-lg border border-green-100">
                  <span className="font-medium">Change to return:</span>
                  <span className="text-xl font-bold">{formatCurrency(change)}</span>
                </div>
              )}
              {isCashInsufficient && cashReceived && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  Insufficient cash received.
                </div>
              )}
            </div>
          )}

          {/* UPI UI */}
          {method === 'upi' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 text-center py-4 space-y-2">
              <div className="inline-block p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                  QR Code
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700">Scan QR to pay {formatCurrency(total)}</p>
              <p className="text-xs text-slate-500">Confirm below once payment is received in your app.</p>
            </div>
          )}

          {/* KHATA UI */}
          {method === 'khata' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <h4 className="font-medium text-orange-800 mb-2">Khata Entry Summary</h4>
                <div className="space-y-1 text-sm text-orange-700/80">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium text-orange-900">{customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Balance:</span>
                    <span>{formatCurrency(customer?.khataBalance || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-orange-200">
                    <span>New Balance:</span>
                    <span className="font-bold text-orange-900">{formatCurrency((customer?.khataBalance || 0) + total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            size="lg"
            onClick={handleConfirm}
            loading={loading}
            disabled={method === 'cash' && isCashInsufficient}
            className={method === 'cash' ? 'bg-blue-600 hover:bg-blue-700' : method === 'upi' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'}
          >
            {method === 'khata' ? 'Add to Khata' : 'Confirm Payment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Discount & Tax Modal ----------
function DiscountModal({ isOpen, onClose, discount, onApply, taxRate, taxType, onTaxChange }) {
  const [val, setVal] = useState(discount.value || '');
  const [type, setType] = useState(discount.type || 'fixed');
  const [tr, setTr] = useState(taxRate || 0);
  const [tt, setTt] = useState(taxType || 'GST');

  const handleApply = () => {
    onApply({ value: parseFloat(val) || 0, type });
    onTaxChange(parseFloat(tr) || 0, tt);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Discount & Tax" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Discount</label>
          <div className="flex gap-2">
            <Dropdown
              value={type}
              onChange={setType}
              options={[
                { value: 'fixed', label: '₹' },
                { value: 'percent', label: '%' }
              ]}
              className="w-28 shrink-0"
            />
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={tr}
              onChange={(e) => setTr(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="0"
              min="0"
            />
            <div className="flex shrink-0 items-center justify-center px-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium">
              %
            </div>
            <Dropdown
              value={tt}
              onChange={setTt}
              options={[
                { value: 'GST', label: 'GST' },
                { value: 'CGST', label: 'CGST' },
                { value: 'SGST', label: 'SGST' },
                { value: 'IGST', label: 'IGST' }
              ]}
              className="w-32 shrink-0"
            />
          </div>
        </div>

        <Button onClick={handleApply} fullWidth>Apply</Button>
      </div>
    </Modal>
  );
}

// ---------- Additional Charges Modal ----------
function AdditionalChargesModal({ isOpen, onClose, charges, onApply }) {
  const [tempCharges, setTempCharges] = useState(charges || []);

  const addCharge = () => {
    setTempCharges([...tempCharges, { name: '', amount: '' }]);
  };

  const removeCharge = (index) => {
    setTempCharges(tempCharges.filter((_, i) => i !== index));
  };

  const updateCharge = (index, field, value) => {
    const newCharges = [...tempCharges];
    newCharges[index][field] = value;
    setTempCharges(newCharges);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Additional Charges" size="md">
      <div className="space-y-4">
        {tempCharges.map((c, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Charge Name (e.g. Delivery)"
              value={c.name}
              onChange={(e) => updateCharge(i, 'name', e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
            <input 
              type="number" 
              placeholder="Amount"
              value={c.amount}
              onChange={(e) => updateCharge(i, 'amount', e.target.value)}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
            <button 
              onClick={() => removeCharge(i)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
            >
              ×
            </button>
          </div>
        ))}

        <Button variant="outline" onClick={addCharge} fullWidth className="border-dashed">
          + Add Charge
        </Button>

        <Button onClick={() => { onApply(tempCharges); onClose(); }} fullWidth>
          Save Charges
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Invoice Success Modal ----------
function InvoiceSuccessModal({ invoice, storeSettings, onClose, onNewBill }) {
  // Use a ref to trigger print
  const printRef = useRef(null);

  const handlePrint = () => {
    const originalTitle = document.title;
    const customerName = invoice?.customer?.name || 'Walk-in Customer';
    document.title = `Invoice_${invoice?.invoiceNumber}_${customerName}`.replace(/\s+/g, '_');
    window.print();
    document.title = originalTitle;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Bill Generated Successfully" size="md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
          >
            <Check className="w-8 h-8 text-emerald-600" />
          </motion.div>
          
          <h3 className="font-bold text-lg text-slate-900 mt-4">Invoice #{invoice.invoiceNumber}</h3>
          <p className="text-sm text-slate-500">{invoice.customer?.name} • {(invoice.customer?.normalizedMobile && invoice.customer?.normalizedMobile !== '+') ? invoice.customer?.normalizedMobile : invoice.customer?.phone}</p>
          
          <div className="p-4 bg-slate-50 rounded-xl mt-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount Paid via {invoice.paymentMethod}</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(invoice.grandTotal)}</p>
          </div>
        </div>

        <div className="pt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-slate-600 hover:text-slate-900">
            Close
          </Button>
          <Button variant="secondary" onClick={() => {
            const text = `Invoice ${invoice.invoiceNumber}\nTotal: ${formatCurrency(invoice.grandTotal)}\n\nThank you for shopping with us!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          }} icon={Share2} className="w-full sm:col-span-2 sm:w-auto">
            Share Bill
          </Button>
          {invoice.paymentMethod === 'khata' && (
             <Button variant="outline" className="w-full sm:col-span-2 sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => {
                const link = `${window.location.origin}/khata-sync/${invoice.customer.id}`;
                let text = `Dear ${invoice.customer.name}, your Khata ledger is ready.`;
                if (storeSettings?.upiId) {
                  text += `\nYou can pay your dues via UPI: ${storeSettings.upiId}`;
                }
                text += `\n\nView your live ledger here: ${link}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
             }}>
               Share Khata Link
             </Button>
          )}
          <Button variant="primary" onClick={handlePrint} icon={Printer} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-sm">
            Print Bill
          </Button>
        </div>
      </div>
    </Modal>
  );
}
