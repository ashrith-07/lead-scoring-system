import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Rules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    api.rules.getAll().then(r => setRules(r.data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Scoring Rules</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {rules.map(r => (
          <div
            key={r._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{r.event_type}</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">Points: <strong>{r.points}</strong></p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status: {r.active ? 'Active' : 'Inactive'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}