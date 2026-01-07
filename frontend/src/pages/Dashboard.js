import { useEffect, useState } from "react";
import { getLeads } from "../services/api";
import { Link } from "react-router-dom";

const statusColor = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-yellow-100 text-yellow-700",
  cold: "bg-blue-100 text-blue-700",
};

export default function Dashboard() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    getLeads().then(r => setLeads(r.data || []));
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Leads Overview</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {leads.map(l => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{l.name}</td>
                <td className="px-6 py-4 text-gray-600">{l.email}</td>
                <td className="px-6 py-4 font-semibold">{l.current_score}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[l.status]}`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/leads/${l._id}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
