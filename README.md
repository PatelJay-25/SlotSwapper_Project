# SlotSwapper (MERN)

A peer-to-peer time-slot scheduling platform where users can swap calendar events.

## Overview & Design Choices
- MERN stack: Express API with MongoDB (Mongoose), React front-end (Vite), JWT auth
- Simple, explicit data model with three collections: `User`, `Event`, `SwapRequest`
- Event lifecycle statuses: `BUSY`, `SWAPPABLE`, `SWAP_PENDING` to control marketplace visibility and concurrent requests
- Auth: stateless JWT (7d expiry), bcrypt password hashing; protected routes via middleware
- Frontend: React Router with RouterProvider (v7 future flags enabled to be warning-free), React Query for server-state, Axios client with auth interceptor, Tailwind for responsive UI
- Swap logic on server guarantees integrity (owner swap is atomic at the API level; both events updated together)
- Robustness: if an event in a pending swap is deleted, the swap is auto-rejected and the surviving event (if any) is restored to `SWAPPABLE`

## Tech Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt
- Frontend: React (Vite), React Router, React Query, Tailwind CSS

## Project Structure
```
backend/
  src/
    config/db.js
    middleware/auth.js
    models/{User.js, Event.js, SwapRequest.js}
    routes/{auth.js, events.js, swaps.js}
    server.js
frontend/
  src/
    lib/{auth.js, api.js}
    pages/{LoginPage.jsx, SignupPage.jsx, DashboardPage.jsx, MarketplacePage.jsx, RequestsPage.jsx}
    App.jsx, main.jsx, index.css
  index.html
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally or a connection string

### Backend
```
cd backend
npm install
# Copy env.sample to .env (commit-safe)
# Windows PowerShell: copy .\env.sample .\.env
# macOS/Linux: cp env.sample .env
npm run dev
```
Environment variables:
- PORT=5000
- MONGODB_URI=mongodb://127.0.0.1:27017/slotswapper
- JWT_SECRET=replace_with_strong_secret
- CLIENT_ORIGIN=http://localhost:5173

### Frontend
```
cd frontend
npm install
# Create .env.local with: VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
```

## Core API
| Method | Path                       | Auth | Body / Params                                | Description |
|--------|----------------------------|------|----------------------------------------------|-------------|
| POST   | /api/auth/signup           | No   | { name, email, password }                    | Create user, returns JWT + user |
| POST   | /api/auth/login            | No   | { email, password }                          | Login, returns JWT + user |
| GET    | /api/events                | Yes  | —                                            | List my events |
| POST   | /api/events                | Yes  | { title, startTime, endTime, status? }       | Create my event |
| PUT    | /api/events/:id            | Yes  | partial Event fields                          | Update my event |
| DELETE | /api/events/:id            | Yes  | —                                            | Delete my event (auto-rejects related pending swaps) |
| GET    | /api/swappable-slots       | Yes  | —                                            | Other users’ `SWAPPABLE` events |
| POST   | /api/swap-request          | Yes  | { mySlotId, theirSlotId }                    | Create swap request; sets both to `SWAP_PENDING` |
| POST   | /api/swap-response/:id     | Yes  | { accepted: true\|false }                    | Accept: swap owners + set `BUSY`; Reject: reset to `SWAPPABLE` |
| GET    | /api/swap-requests         | Yes  | —                                            | My incoming/outgoing swap requests (populated) |

Notes
- Provide `Authorization: Bearer <token>` on all protected routes.
- Times are ISO strings (Date) and stored as UTC in MongoDB.

Quick cURL examples
```
# Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"pass"}'

# List others' swappable slots
curl -s http://localhost:5000/api/swappable-slots -H "Authorization: Bearer $TOKEN"

# Create swap request
curl -s -X POST http://localhost:5000/api/swap-request \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"mySlotId":"<MY_EVENT_ID>","theirSlotId":"<THEIR_EVENT_ID>"}'

# Respond to swap (accept)
curl -s -X POST http://localhost:5000/api/swap-response/<REQUEST_ID> \
  -H "Authorization: Bearer $OTHER_TOKEN" -H "Content-Type: application/json" \
  -d '{"accepted":true}'
```

## Notes
- Use the Dashboard to create events and mark them as SWAPPABLE.
- Request swaps from the Marketplace after selecting one of your SWAPPABLE events.
- Manage incoming/outgoing requests in Requests.

## Assumptions
- Users only swap full events (no partial time-range swaps in this version)
- A swap involves exactly two events; multi-way swaps are not supported
- A user can request a swap only if both events are `SWAPPABLE` at request time
- Timestamps are treated as UTC for storage; the UI shows the browser’s local time

## Challenges & Decisions
- Concurrency and integrity: Ensuring two users can’t accept/alter the same slot simultaneously. Resolved by status gating (`SWAPPABLE` → `SWAP_PENDING`) and atomic updates during accept path.
- Deleted events in pending swaps: Could lead to stuck requests. Added server-side cleanup to auto-reject pending swaps and restore the surviving event to `SWAPPABLE`.
- Route deprecation warnings: Migrated to RouterProvider with v7 future flags to keep the console warning-free while preserving behavior.
- UX clarity: Marketplace requires selecting “my swappable event” to enable requesting; added clear disabled states and consistent Tailwind components.
- Validation: Enforced alphabetic names and string passwords on signup; added helpful client-side messages mirroring server rules.
