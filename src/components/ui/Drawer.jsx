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
  const slideFrom = side === 'left' ? { x: '-100%' } : { x: '100%' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={slideFrom}
            animate={{ x: 0 }}
            exit={slideFrom}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'}
              h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col
              ${className}
            `}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
