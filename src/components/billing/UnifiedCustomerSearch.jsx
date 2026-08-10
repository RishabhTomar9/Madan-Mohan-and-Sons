import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, UserPlus, X, Phone, User, Check, AlertCircle } from 'lucide-react';
import { searchCustomers, quickCreateCustomer, checkDuplicateCustomer } from '../../services/customerService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { formatCurrency } from '../../utils/currency';

export default function UnifiedCustomerSearch({ onCustomerSelected, selectedCustomer, onClear }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const wrapperRef = useRef(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const res = await searchCustomers(searchTerm);
          setResults(res);
          setShowDropdown(true);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customer) => {
    onCustomerSelected(customer);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newName || !newMobile) {
      setCreateError('Name and Mobile Number are required.');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const duplicate = await checkDuplicateCustomer(newMobile);
      if (duplicate) {
        setCreateError('A customer with this mobile number already exists.');
        setIsCreating(false);
        return;
      }

      const newCustomer = await quickCreateCustomer(newName, newMobile, newAddress, newCity);
      onCustomerSelected(newCustomer);
      setShowCreateModal(false);
      
      // Reset form
      setNewName('');
      setNewMobile('');
      setNewAddress('');
      setNewCity('');
    } catch (err) {
      console.error('Failed to create customer:', err);
      setCreateError('Failed to create customer. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateModal = () => {
    setShowDropdown(false);
    // If searchTerm is mostly numbers, pre-fill mobile. Otherwise pre-fill name.
    const isNum = /^[0-9+\-\s]+$/.test(searchTerm);
    if (isNum) {
      setNewMobile(searchTerm);
      setNewName('');
    } else {
      setNewName(searchTerm);
      setNewMobile('');
    }
    setShowCreateModal(true);
  };

  if (selectedCustomer) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 mb-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full hidden sm:block">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm md:text-base flex items-center gap-1 md:gap-2">
              <span className="truncate max-w-[120px] sm:max-w-xs">{selectedCustomer.name || 'Unnamed Customer'}</span>
              <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500 shrink-0" />
            </h3>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <Phone className="h-3 w-3" /> {(selectedCustomer.normalizedMobile && selectedCustomer.normalizedMobile !== '+') ? selectedCustomer.normalizedMobile : (selectedCustomer.phone || 'N/A')}
            </p>
            {selectedCustomer.email && (
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCustomer.email}
              </p>
            )}
            {(selectedCustomer.khataBalance > 0) && (
              <p className="text-[10px] md:text-xs font-bold text-orange-600 mt-0.5">
                Khata: {formatCurrency(selectedCustomer.khataBalance)}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClear} className="text-slate-500 text-xs px-2 md:px-3 h-8">
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 relative" ref={wrapperRef}>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-lg"
            placeholder="Search Customer by Mobile Number or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchTerm.length >= 2) setShowDropdown(true);
            }}
          />
          {searchTerm && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => { setSearchTerm(''); setResults([]); setShowDropdown(false); }}
            >
              <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <Button onClick={openCreateModal} className="py-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add New
        </Button>
      </div>

      {/* Dropdown Results */}
      {showDropdown && searchTerm.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden">
          {isSearching ? (
            <div className="p-4 text-center text-slate-500">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-auto divide-y divide-slate-100">
              {results.map((customer) => (
                <li 
                  key={customer.id} 
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(customer)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900">{customer.name || 'Unnamed Customer'}</p>
                      <p className="text-sm text-slate-500">{(customer.normalizedMobile && customer.normalizedMobile !== '+') ? customer.normalizedMobile : customer.phone}</p>
                      {customer.email && <p className="text-xs text-slate-400 mt-0.5">{customer.email}</p>}
                    </div>
                    {customer.khataBalance > 0 && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        Khata: {formatCurrency(customer.khataBalance)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
              <li className="p-3 bg-blue-50 border-t border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={openCreateModal}>
                <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                  <UserPlus className="h-4 w-4" />
                  Not found? Create "{searchTerm}"
                </div>
              </li>
            </ul>
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-500 mb-4">No customer found for "{searchTerm}"</p>
              <Button onClick={openCreateModal} size="sm">
                + Create New Customer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
          {createError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{createError}</p>
            </div>
          )}
          
          <Input
            label="Mobile Number"
            placeholder="e.g. 9876543210"
            value={newMobile}
            onChange={(e) => setNewMobile(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Customer Name"
            placeholder="e.g. Rahul Sharma"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Input
            label="Address (Optional)"
            placeholder="e.g. 123 Main St"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <Input
            label="City (Optional)"
            placeholder="e.g. Delhi"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
          />
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
