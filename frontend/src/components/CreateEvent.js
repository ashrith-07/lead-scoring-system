import { submitEventImmediate } from "../services/api";

const EVENTS = [
  { id: "email_open", color: "bg-blue-600" },
  { id: "page_view", color: "bg-indigo-600" },
  { id: "form_submission", color: "bg-purple-600" },
  { id: "demo_request", color: "bg-orange-600" },
  { id: "purchase", color: "bg-green-600" },
];

export default function CreateEvent({ leadId, onSuccess }) {
  const submit = async (type) => {
    await submitEventImmediate({
      event_id: `${Date.now()}_${type}`,
      event_type: type,
      lead_id: leadId,
      timestamp: new Date().toISOString(),
    });
    onSuccess();
  };

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {EVENTS.map(e => (
        <button
          key={e.id}
          onClick={() => submit(e.id)}
          className={`${e.color} text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition`}
        >
          {e.id}
        </button>
      ))}
    </div>
  );
}
