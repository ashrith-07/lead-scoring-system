import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getLead, getScoreTrend } from "../services/api";
import useSocket from "../hooks/useSocket";
import CreateEvent from "../components/CreateEvent";
import DemoEvents from "../components/DemoEvents";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold">{lead.name}</h2>
        <p className="text-gray-600">{lead.email}</p>

        <div className="flex gap-6 mt-4">
          <div>
            <div className="text-sm text-gray-500">Score</div>
            <div className="text-2xl font-bold">{lead.current_score}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-semibold capitalize">{lead.status}</div>
          </div>
        </div>

        <CreateEvent leadId={id} onSuccess={loadData} />
        <DemoEvents leadId={id} onDone={loadData} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Score Trend</h3>
        <LineChart width={600} height={300} data={trend}>
          <XAxis dataKey="timestamp" hide />
          <YAxis />
          <Tooltip />
          <Line dataKey="score" stroke="#2563eb" strokeWidth={3} />
        </LineChart>
      </div>
    </div>
  );
}
