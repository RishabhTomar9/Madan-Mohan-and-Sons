import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: '!bg-slate-900 !text-white !rounded-xl !shadow-xl !font-medium',
              duration: 3000,
            }}
          />
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
