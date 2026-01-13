import api from '../services/api';

const events = [
  'email_open',
  'page_view',
  'form_submission',
  'demo_request',
  'purchase',
];

export default function CreateEvent({ leadId, onSuccess }) {
  const submit = async (type) => {
    await api.events.processNow({
      event_id: `${Date.now()}_${type}`,
      event_type: type,
      lead_id: leadId,
      timestamp: new Date().toISOString(),
    });
    onSuccess();
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {events.map(e => (
        <button
          key={e}
          onClick={() => submit(e)}
          className="px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
        >
          {e}
        </button>
      ))}
    </div>
  );
}