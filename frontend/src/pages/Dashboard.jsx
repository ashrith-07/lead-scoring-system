import { useEffect, useState } from 'react';
import { Users, TrendingUp, Activity, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.leads.getStats(),
      api.leads.getLeaderboard(5),
    ]).then(([statsRes, leaderRes]) => {
      setStats(statsRes.data);
      setLeaderboard(leaderRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={Users}
          delay={0}
        />
        <StatsCard
          title="Hot Leads"
          value={stats?.status_breakdown.hot || 0}
          icon={TrendingUp}
          trend={{ value: 12, label: 'vs last week' }}
          delay={0.1}
        />
        <StatsCard
          title="Warm Leads"
          value={stats?.status_breakdown.warm || 0}
          icon={Activity}
          delay={0.2}
        />
        <StatsCard
          title="Avg Score"
          value={Math.round(stats?.score_stats.avg_score || 0)}
          icon={Award}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performers</h3>
              <Link to="/leads" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>

            <div className="space-y-4">
              {leaderboard.map((lead, index) => (
                <Link
                  key={lead._id}
                  to={`/leads/${lead._id}`}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    #{index + 1}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{lead.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lead.email}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{lead.current_score}</p>
                    <Badge variant={lead.status}>{lead.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6" hover>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Score Distribution</h4>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Hot (151+)', value: stats?.status_breakdown.hot || 0, color: 'bg-red-500' },
              { label: 'Warm (51-150)', value: stats?.status_breakdown.warm || 0, color: 'bg-yellow-500' },
              { label: 'Cold (0-50)', value: stats?.status_breakdown.cold || 0, color: 'bg-blue-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${(item.value / stats?.total_leads) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" hover>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Stats</h4>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Max Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.score_stats.max_score || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Min Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.score_stats.min_score || 0}</p>
            </div>
          </div>
        </Card>

        <Link to="/leads/new">
          <Card className="p-6 h-full flex items-center justify-center" hover>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Add New Lead</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a new lead record</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}