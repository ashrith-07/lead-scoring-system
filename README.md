# Lead Scoring System

Event-driven lead scoring system with real-time updates.

## Live Demo

- **Frontend**: https://lead-scoring-system-beta.vercel.app/
- **Backend**: https://lead-scoring-system-7bma.onrender.com

## Tech Stack

**Backend:**

- Node.js + Express
- MongoDB (Atlas)
- Redis (Upstash)
- Bull Queue
- Socket.IO

**Frontend:**

- React + Vite
- Tailwind CSS
- Recharts
- Socket.IO Client

## Features

✅ Real-time score updates via WebSockets
✅ Event-driven architecture with Bull queue
✅ Idempotency handling
✅ Configurable scoring rules
✅ Score history & trends
✅ Batch event processing
✅ CSV/JSON file uploads

## API Endpoints

### Leads

- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead

### Events

- `POST /api/events` - Submit event (queued)
- `POST /api/events/process-now` - Process immediately
- `GET /api/events/stats` - Event statistics

### Scores

- `GET /api/scores/lead/:id` - Score history
- `GET /api/scores/lead/:id/trend` - Score trend

### Rules

- `GET /api/rules` - Get scoring rules
- `PUT /api/rules/:id` - Update rule

## Environment Variables

### Backend

```
MONGODB_URI=your_mongodb_connection_string
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
PORT=5000
MAX_SCORE=1000
FRONTEND_URL=your_frontend_url
```

### Frontend

```
REACT_APP_API_URL=your_backend_url/api
REACT_APP_SOCKET_URL=your_backend_url
```

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env  npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment

- Backend: Railway
- Frontend: Vercel
- Database: MongoDB Atlas (Free M0)
- Redis: Upstash (Free tier)

## Author

Ashrith R
