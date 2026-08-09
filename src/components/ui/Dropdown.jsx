import { ChevronDown } from 'lucide-react';

export default function Dropdown({ label, options, value, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
}
