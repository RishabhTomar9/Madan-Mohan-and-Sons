import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  className = '',
}) {
  let slideFrom = { x: '100%' };
  if (side === 'left') slideFrom = { x: '-100%' };
  if (side === 'bottom') slideFrom = { y: '100%' };

  let sideClasses = '';
  if (side === 'left') sideClasses = 'top-0 left-0 h-full w-[85vw] max-w-sm rounded-r-2xl';
  if (side === 'right') sideClasses = 'top-0 right-0 h-full w-[85vw] max-w-sm rounded-l-2xl';
  if (side === 'bottom') sideClasses = 'bottom-0 left-0 w-full h-auto max-h-[90vh] rounded-t-3xl pb-safe';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={slideFrom}
            animate={side === 'bottom' ? { y: 0 } : { x: 0 }}
            exit={slideFrom}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              absolute bg-white shadow-2xl flex flex-col overflow-hidden
              ${sideClasses}
              ${className}
            `}
          >
            {/* Grab handle for bottom sheet */}
            {side === 'bottom' && (
              <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>
            )}

            {/* Header */}
            {title && (
              <div className={`flex items-center justify-between px-5 ${side === 'bottom' ? 'py-3' : 'py-4'} border-b border-slate-100`}>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-2 pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
