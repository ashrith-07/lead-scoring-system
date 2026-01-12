const BASE = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

const json = (r) => r.json();

export const getLeads = () =>
  fetch(`${BASE}/leads`).then(json);

export const getLead = (id) =>
  fetch(`${BASE}/leads/${id}`).then(json);

export const getRules = () =>
  fetch(`${BASE}/rules`).then(json);

export const getScoreTrend = (leadId) =>
  fetch(`${BASE}/scores/lead/${leadId}/trend`).then(json);

export const submitEventImmediate = (data) =>
  fetch(`${BASE}/events/process-now`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);