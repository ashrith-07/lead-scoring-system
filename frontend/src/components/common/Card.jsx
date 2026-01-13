import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${
        hover ? 'hover:shadow-xl transition-shadow cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}