import api from '../services/api';

const events = [
  'email_open',
  'page_view',
  'form_submission',
  'demo_request',
  'purchase',
];

export default function DemoEvents({ leadId, onDone }) {
  const run = async () => {
    for (const e of events) {
      await api.events.processNow({
        event_id: `${Date.now()}_${e}`,
        event_type: e,
        lead_id: leadId,
        timestamp: new Date().toISOString(),
      });
    }
    onDone();
  };

  return (
    <button
      onClick={run}
      className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition shadow"
    >
      🚀 Generate Demo Events
    </button>
  );
}