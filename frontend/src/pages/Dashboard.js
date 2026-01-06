import { useEffect, useState } from "react";
import { getLeads } from "../services/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    getLeads().then(r => setLeads(r.data || []));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Name</th>
            <th>Email</th>
            <th>Score</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l._id} className="border-t">
              <td>{l.name}</td>
              <td>{l.email}</td>
              <td>{l.current_score}</td>
              <td>{l.status}</td>
              <td>
                <Link
                  to={`/leads/${l._id}`}
                  className="text-blue-600 underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
