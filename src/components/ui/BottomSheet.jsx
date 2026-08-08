import { motion, AnimatePresence } from 'framer-motion';

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              relative w-full bg-white rounded-t-2xl shadow-2xl
              max-h-[85vh] flex flex-col overflow-hidden
              ${className}
            `}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {title && (
              <div className="px-4 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
