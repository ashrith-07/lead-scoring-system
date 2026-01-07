import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getLead, getScoreTrend } from "../services/api";
import useSocket from "../hooks/useSocket";
import CreateEvent from "../components/CreateEvent";
import DemoEvents from "../components/DemoEvents";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [trend, setTrend] = useState([]);

  const loadData = useCallback(() => {
    getLead(id).then(r => setLead(r.data.lead));
    getScoreTrend(id).then(r => setTrend(r.data || []));
  }, [id]);

  useEffect(loadData, [loadData]);

  useSocket(id, data => {
    setLead(l => ({
      ...l,
      current_score: data.new_score,
      status: data.new_status,
    }));
  });

  if (!lead) return null;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold">{lead.name}</h1>
        <p className="text-gray-600">{lead.email}</p>

        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-xl font-semibold">{lead.current_score}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-xl font-semibold capitalize">{lead.status}</p>
          </div>
        </div>

        <CreateEvent leadId={id} onSuccess={loadData} />
        <DemoEvents leadId={id} onDone={loadData} />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Score Trend</h2>

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
