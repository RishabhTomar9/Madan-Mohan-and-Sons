import { Check } from 'lucide-react';

export default function Checkbox({ checked, onChange, label, description, className = '' }) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
      <div className={`
        relative mt-0.5 shrink-0 w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center
        ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}
      `}>
        {checked && <Check size={14} className="text-white drop-shadow-sm" />}
        <input 
          type="checkbox" 
          className="hidden" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
      </div>
      <div>
        {label && <p className={`text-sm font-medium transition-colors ${checked ? 'text-indigo-900' : 'text-slate-700'}`}>{label}</p>}
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}
