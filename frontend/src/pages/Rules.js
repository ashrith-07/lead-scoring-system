import { useEffect, useState } from "react";
import { getRules } from "../services/api";

export default function Rules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getRules().then(r => setRules(r.data || []));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Scoring Rules</h1>

      {rules.map(r => (
        <div
          key={r._id}
          className="bg-white border p-4 mb-3 rounded shadow"
        >
          <div className="font-semibold text-lg">{r.event_type}</div>
          <div>Points: {r.points}</div>
          <div>Status: {r.active ? "Active" : "Inactive"}</div>
        </div>
      ))}
    </div>
  );
}
