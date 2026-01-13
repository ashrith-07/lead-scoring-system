import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MousePointer, FileText, Video, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Card from '../common/Card';
import { io } from 'socket.io-client';

const eventIcons = {
  email_open: Mail,
  page_view: MousePointer,
  form_submission: FileText,
  demo_request: Video,
  purchase: ShoppingCart,
};

const eventColors = {
  email_open: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  page_view: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  form_submission: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  demo_request: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  purchase: 'text-red-600 bg-red-100 dark:bg-red-900/30',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
  const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5050');

  socket.on('score:global_update', (data) => {
    const activity = {
      id: Date.now(),
      ...data,
      timestamp: new Date(data.timestamp),
    };
    
    setActivities(prev => [activity, ...prev].slice(0, 10));
  });

  return () => socket.disconnect();
}, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Activity</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Waiting for activity...</p>
          ) : (
            activities.map(activity => {
              const Icon = eventIcons[activity.preview?.new_score ? 'purchase' : 'email_open'];
              const colorClass = eventColors[activity.preview?.new_score ? 'purchase' : 'email_open'];

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.preview?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Score: {activity.preview?.new_score || 0} • {activity.preview?.status || 'cold'}
                    </p>
                  </div>

                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}