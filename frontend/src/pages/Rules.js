import { useEffect, useState } from "react";
import { getRules } from "../services/api";

export default function Rules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getRules().then(r => setRules(r.data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Scoring Rules</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {rules.map(r => (
          <div
            key={r._id}
            className="bg-white p-5 rounded-lg shadow border"
          >
            <h3 className="font-semibold text-lg mb-2">
              {r.event_type}
            </h3>
            <p className="text-gray-600">Points: {r.points}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
              Active
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
