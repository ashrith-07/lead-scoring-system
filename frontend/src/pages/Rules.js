import { useEffect, useState } from "react";
import { getRules } from "../services/api";

export default function Rules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getRules().then(r => setRules(r.data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Scoring Rules</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {rules.map(r => (
          <div
            key={r._id}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold">{r.event_type}</h3>
            <p className="mt-2">Points: <strong>{r.points}</strong></p>
            <p className="text-sm text-gray-500">
              Status: {r.active ? "Active" : "Inactive"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
