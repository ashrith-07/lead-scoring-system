import { useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import CreateEvent from '../components/CreateEvent';
import DemoEvents from '../components/DemoEvents';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [trend, setTrend] = useState([]);

  const loadData = useCallback(() => {
    api.leads.getById(id).then(r => setLead(r.data.lead));
    api.scores.getTrend(id).then(r => setTrend(r.data || []));
  }, [id]);

  useEffect(loadData, [loadData]);

  useSocket(id, data => {
    setLead(l => ({
      ...l,
      current_score: data.new_score,
      status: data.new_status,
    }));
  });

  if (!lead) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">{lead.email}</p>

        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{lead.current_score}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-xl font-semibold capitalize text-gray-900 dark:text-white">{lead.status}</p>
          </div>
        </div>

        <CreateEvent leadId={id} onSuccess={loadData} />
        <DemoEvents leadId={id} onDone={loadData} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Score Trend</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Line
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}