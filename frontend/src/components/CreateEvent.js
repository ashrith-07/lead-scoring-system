import { submitEventImmediate } from "../services/api";

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
    <div className="flex gap-2 flex-wrap">
      {["email_open", "page_view", "form_submission", "demo_request", "purchase"].map(t => (
        <button
          key={t}
          onClick={() => submit(t)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {t}
        </button>
      ))}
    </div>
  );
}
