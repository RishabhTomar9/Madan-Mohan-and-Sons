import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5
            text-sm text-slate-900 placeholder:text-slate-400
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            disabled:bg-slate-50 disabled:text-slate-500
            transition-colors duration-150
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

export default Input;
