import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm
                   placeholder:text-slate-400 focus:bg-white focus:border-indigo-500
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150"
        {...props}
      />
    </div>
  );
}
