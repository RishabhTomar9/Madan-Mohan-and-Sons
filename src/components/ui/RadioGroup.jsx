export function RadioGroup({ value, onChange, options, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <label 
            key={option.id}
            className={`
              flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
              ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200 bg-white'}
            `}
          >
            <div className={`
              mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${isSelected ? 'border-indigo-600' : 'border-slate-300'}
            `}>
              <div className={`w-2.5 h-2.5 rounded-full bg-indigo-600 transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                  {option.label}
                </span>
                {option.rightElement && <span>{option.rightElement}</span>}
              </div>
              {option.description && (
                <p className="text-sm text-slate-500 mt-1 leading-snug">{option.description}</p>
              )}
            </div>

            <input 
              type="radio" 
              className="hidden" 
              name="radio-group"
              checked={isSelected}
              onChange={() => onChange(option.id)}
            />
          </label>
        );
      })}
    </div>
  );
}
