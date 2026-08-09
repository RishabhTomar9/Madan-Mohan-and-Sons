import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'mms_cart';

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // Filter out invalid items (like those saved with undefined price due to the previous bug)
    return parsed.filter(item => item && item.productId && typeof item.price === 'number' && !isNaN(item.price));
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const pId = product.productId || product.id;
      const existing = prev.find((item) => item.productId === pId);
      
      if (existing) {
        return prev.map((item) =>
          item.productId === pId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prev, {
        productId: pId,
        name: product.name,
        price: product.price || product.sellingPrice,
        imageUrl: product.imageUrl || (product.images ? product.images[0] : null) || product.image,
        quantity,
        maxStock: product.stock,
      }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    getItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
