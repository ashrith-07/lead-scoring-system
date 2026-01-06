# 🚀 Lead Scoring System

A **full-stack Lead Scoring System** that tracks user interactions, assigns scores based on predefined rules, and updates lead status in real time.

This project demonstrates **event-driven backend design**, **real-time communication**, and **data visualization** using a modern tech stack.

---

## 🧠 What This Project Does

* Stores and manages leads (users/customers)
* Accepts behavioral events (email open, page view, form submission, etc.)
* Calculates scores based on scoring rules
* Automatically updates lead status (**cold / warm / hot**)
* Sends real-time updates to the frontend
* Displays score progression in a visual graph

---

## ✨ Features

### Backend

* REST APIs for leads, events, scores, and rules
* Event processing using Redis queues
* Real-time score updates using Socket.IO
* MongoDB for persistent storage
* Automatic initialization of scoring rules
* Retry handling for failed event processing

### Frontend

* Dashboard showing all leads with score & status
* Lead detail page with:
  * Live score updates
  * Score trend graph
  * Manual event creation
  * Demo event generator
* Rules page showing active scoring rules
* Clean UI using Tailwind CSS

---

## 🏗️ System Architecture

<pre class="overflow-visible! px-0!" data-start="1462" data-end="1622"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>React</span><span> </span><span>Frontend</span><span>
      |
      | REST API
      v
</span><span>Node.js</span><span> </span><span>+</span><span> </span><span>Express</span><span> </span><span>Backend</span><span>
      |
      | Event Queue
      v
</span><span>Redis</span><span> </span><span>(Bull</span><span> </span><span>Queue)</span><span>
      |
      v
</span><span>MongoDB</span><span>
</span></span></code></div></div></pre>

Real-time updates are pushed using **Socket.IO**.

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express
* MongoDB (Mongoose)
* Redis (Bull Queue)
* Socket.IO

### Frontend

* React
* React Router
* Tailwind CSS
* Recharts
* Socket.IO Client

---

## 📁 Project Structure

### Backend

<pre class="overflow-visible! px-0!" data-start="1910" data-end="2167"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>backend/
├── config/          </span><span># DB & Redis config</span><span>
├── models/          </span><span># Mongoose schemas</span><span>
├── routes/          </span><span># API routes</span><span>
├── queue/           </span><span># Workers & queues</span><span>
├── </span><span>socket</span><span>/          </span><span># Socket.IO logic</span><span>
├── middleware/
├── server.js
└── package.json
</span></span></code></div></div></pre>

### Frontend

<pre class="overflow-visible! px-0!" data-start="2182" data-end="2420"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>frontend/
├── src/
│   ├── components/ </span><span># Reusable UI components</span><span>
│   ├── hooks/      </span><span># Custom hooks (socket)</span><span>
│   ├── pages/      </span><span># Dashboard, LeadDetail, Rules</span><span>
│   ├── services/   </span><span># API calls (fetch)</span><span>
│   ├── App.js
│   └── index.js
</span></span></code></div></div></pre>

---

## 📊 Scoring Rules (Default)


| Event Type       | Points |
| ---------------- | ------ |
| email\_open      | +10    |
| page\_view       | +5     |
| form\_submission | +20    |
| demo\_request    | +15    |
| purchase         | +100   |

### Lead Status Logic

* **Cold** → score < 20
* **Warm** → score ≥ 20
* **Hot** → score ≥ 100

---

## 🔌 API Overview

<pre class="overflow-visible! px-0!" data-start="2790" data-end="2924"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-http"><span>GET    /api/leads
GET    /api/leads/:id
POST   /api/events/process-now
GET    /api/scores/lead/:id/trend
GET    /api/rules
</span></code></div></div></pre>

---

## ▶️ Running Locally

### Backend

<pre class="overflow-visible! px-0!" data-start="2966" data-end="3012"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>cd</span><span> backend
npm install
npm run dev
</span></span></code></div></div></pre>

Runs on:

<pre class="overflow-visible! px-0!" data-start="3023" data-end="3052"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>http:</span><span>//localhost:5050</span><span>
</span></span></code></div></div></pre>

### Frontend

<pre class="overflow-visible! px-0!" data-start="3067" data-end="3112"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>cd</span><span> frontend
npm install
npm start
</span></span></code></div></div></pre>

Runs on:

<pre class="overflow-visible! px-0!" data-start="3123" data-end="3152"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>http:</span><span>//localhost:3000</span><span>
</span></span></code></div></div></pre>

---

## 🎯 Why This Project Is Valuable

This project showcases:

* Real-time systems
* Event-driven architecture
* Queue-based background processing
* Scalable backend design
* Clean frontend-backend separation

It closely resembles **real-world CRM and marketing automation systems**.

---

## 🔮 Possible Improvements

* Authentication & role-based access
* Admin UI for managing scoring rules
* Webhook integrations
* Better analytics dashboards
* Pagination & filtering

---

## 👤 Author

**Ashrith R**
Full Stack Developer
