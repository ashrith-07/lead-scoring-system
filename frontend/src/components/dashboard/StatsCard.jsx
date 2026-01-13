import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, delay = 0 }) {
  const isPositive = trend?.value > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 dark:text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </motion.div>
  );
}