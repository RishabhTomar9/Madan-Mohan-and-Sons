import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-slate-300">404</p>
        <h1 className="text-xl font-semibold text-slate-700">Page not found</h1>
        <p className="text-sm text-slate-500">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')} icon={Home}>Go Home</Button>
      </div>
    </div>
  );
}
