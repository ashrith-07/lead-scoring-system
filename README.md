🚀 Lead Scoring System

A full-stack Lead Scoring System that tracks user interactions, assigns scores based on predefined rules, and updates lead status in real time.

This project demonstrates event-driven backend design, real-time communication, and data visualization using a modern tech stack.

🧠 What This Project Does

Stores and manages leads (users/customers)

Accepts behavioral events (email open, page view, form submission, etc.)

Calculates scores based on scoring rules

Automatically updates lead status (cold / warm / hot)

Sends real-time updates to the frontend

Displays score progression in a visual graph

✨ Features
Backend

REST APIs for leads, events, scores, and rules

Event processing using Redis queues

Real-time score updates using Socket.IO

MongoDB for persistent storage

Automatic initialization of scoring rules

Retry handling for failed event processing

Frontend

Dashboard showing all leads with score & status

Lead detail page with:

Live score updates

Score trend graph

Manual event creation

Demo event generator

Rules page showing active scoring rules

Clean UI using Tailwind CSS

🏗️ System Architecture
React Frontend
      |
      | REST API
      v
Node.js + Express Backend
      |
      | Event Queue
      v
Redis (Bull Queue)
      |
      v
MongoDB


Real-time updates are pushed using Socket.IO.

🛠️ Tech Stack
Backend

Node.js

Express

MongoDB (Mongoose)

Redis (Bull Queue)

Socket.IO

Frontend

React

React Router

Tailwind CSS

Recharts

Socket.IO Client

📁 Project Structure
Backend
backend/
├── config/          # DB & Redis config
├── models/          # Mongoose schemas
├── routes/          # API routes
├── queue/           # Workers & queues
├── socket/          # Socket.IO logic
├── middleware/
├── server.js
└── package.json

Frontend
frontend/
├── src/
│   ├── components/ # Reusable UI components
│   ├── hooks/      # Custom hooks (socket)
│   ├── pages/      # Dashboard, LeadDetail, Rules
│   ├── services/   # API calls (fetch)
│   ├── App.js
│   └── index.js

📊 Scoring Rules (Default)
Event Type	Points
email_open	+10
page_view	+5
form_submission	+20
demo_request	+15
purchase	+100
Lead Status Logic

Cold → score < 20

Warm → score ≥ 20

Hot → score ≥ 100

🔌 API Overview
GET    /api/leads
GET    /api/leads/:id
POST   /api/events/process-now
GET    /api/scores/lead/:id/trend
GET    /api/rules

▶️ Running Locally
Backend
cd backend
npm install
npm run dev


Runs on:

http://localhost:5050

Frontend
cd frontend
npm install
npm start


Runs on:

http://localhost:3000

🎯 Why This Project Is Valuable

This project showcases:

Real-time systems

Event-driven architecture

Queue-based background processing

Scalable backend design

Clean frontend-backend separation

It closely resembles real-world CRM and marketing automation systems.

🔮 Possible Improvements

Authentication & role-based access

Admin UI for managing scoring rules

Webhook integrations

Better analytics dashboards

Pagination & filtering

👤 Author

Ashrith R
Full Stack Developer
