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
    <div className="p-8">
      <div className="bg-white p-6 shadow rounded">
        <h1 className="text-xl font-bold">{lead.name}</h1>
        <p>{lead.email}</p>
        <p className="mt-2">Score: {lead.current_score}</p>
        <p>Status: {lead.status}</p>

        <CreateEvent leadId={id} onSuccess={loadData} />
        <DemoEvents leadId={id} onDone={loadData} />
      </div>

      <div className="mt-6 bg-white p-6 shadow rounded">
        <h2 className="font-semibold mb-2">Score Trend</h2>
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
