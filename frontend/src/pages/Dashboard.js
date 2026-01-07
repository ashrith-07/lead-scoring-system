import { useEffect, useState } from "react";
import { getLeads } from "../services/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    getLeads().then(r => setLeads(r.data || []));
  }, []);

  const badge = (status) => {
    const map = {
      hot: "bg-red-100 text-red-700",
      warm: "bg-yellow-100 text-yellow-700",
      cold: "bg-blue-100 text-blue-700",
    };
    return `px-3 py-1 rounded-full text-sm font-medium ${map[status]}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Leads</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="p-4">Name</th>
              <th>Email</th>
              <th>Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {leads.map(l => (
              <tr key={l._id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{l.name}</td>
                <td className="text-gray-600">{l.email}</td>
                <td className="font-semibold">{l.current_score}</td>
                <td>
                  <span className={badge(l.status)}>{l.status}</span>
                </td>
                <td className="pr-4">
                  <Link
                    to={`/leads/${l._id}`}
                    className="text-blue-600 hover:underline font-medium"
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
