# Nocturne — Gothic Dating App

A fullstack gothic-themed dating web application with a dark, romantic aesthetic. Built with React, Node.js, Express, MongoDB, and Socket.IO.

## Features

- **Auth & Onboarding**: Multi-step signup with email/password, gender, orientation preferences, bio, interests, photos, and location
- **Discovery/Swipe**: Tinder-style card stack with drag gestures and keyboard accessibility
- **Matching**: Mutual like system with match celebration modal
- **Real-time Chat**: Socket.IO powered 1:1 messaging with typing indicators, read receipts, and online status
- **Profile Management**: Edit bio, photos, interests, preferences; change password; delete account
- **Safety**: Block, report, and unmatch functionality
- **Gothic Theme**: Custom CSS design system with deep blacks, blood red accents, amethyst purple, bone text, Cinzel/Cormorant Garamond typography

## Tech Stack

- **Frontend**: React 18 + Vite, React Router, Framer Motion, React Tinder Card, Socket.IO Client, Lucide React
- **Backend**: Node.js + Express, MongoDB + Mongoose, Socket.IO, JWT (access + refresh tokens), bcryptjs
- **Styling**: Plain CSS with CSS Variables (no Tailwind/UI kit)

## Project Structure

```
nocturne/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Shared components (Layout, etc.)
│   │   ├── context/        # React contexts (Auth, Socket, Toast)
│   │   ├── pages/          # Page components
│   │   ├── styles/         # Global styles & design system
│   │   ├── utils/          # API utilities, helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── utils/          # JWT, distance calculations
│   │   ├── index.js        # Entry point
│   │   └── seed.js         # Database seeding
│   └── package.json
├── package.json            # Root workspace config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone and install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secrets

# Client
cp client/.env.example client/.env
```

3. Start MongoDB (if local):
```bash
mongod
```

4. Seed the database with test users:
```bash
npm run seed
```

5. Start development servers:
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Test Accounts

After seeding, you can log in with any of these emails (password: `nocturne123`):
- raven0@nocturne.test
- lucien1@nocturne.test
- morgana2@nocturne.test
- ...and 17 more

## Environment Variables

### Server (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/nocturne |
| JWT_ACCESS_SECRET | Access token secret | **Required in production** |
| JWT_REFRESH_SECRET | Refresh token secret | **Required in production** |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |

### Client (.env)

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |
| VITE_SOCKET_URL | Socket.IO server URL |

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user

### Users
- `GET /api/users/me` — Get profile
- `PUT /api/users/me` — Update profile
- `POST /api/users/me/photos` — Update photos
- `PUT /api/users/me/password` — Change password
- `DELETE /api/users/me` — Delete account
- `GET /api/users/discover` — Get discovery candidates

### Swipes
- `POST /api/swipes` — Create swipe (like/pass)

### Matches
- `GET /api/matches` — List matches
- `DELETE /api/matches/:id` — Unmatch
- `GET /api/matches/:id/messages` — Get messages

### Reports
- `POST /api/reports` — Block or report user
- `DELETE /api/reports/block/:userId` — Unblock user

## Socket.IO Events

### Client → Server
- `join_match_room` — Join match room
- `leave_match_room` — Leave match room
- `send_message` — Send message
- `typing` — Typing indicator
- `stop_typing` — Stop typing
- `read_receipt` — Mark messages read

### Server → Client
- `receive_message` — New message
- `user_typing` — Partner typing
- `user_stop_typing` — Partner stopped
- `messages_read` — Messages read
- `new_match` — New match notification

## Data Models

- **User**: email, passwordHash, firstName, birthdate, gender, interestedIn[], bio, photos[], interests[], location, preferences, createdAt
- **Swipe**: swiperId, swipedId, direction, createdAt
- **Match**: user1Id, user2Id, matchedAt, unmatchedAt, unmatchedBy
- **Message**: matchId, senderId, content, sentAt, readAt
- **BlockReport**: reporterId, reportedId, type, reason, createdAt

## Deployment

### Production Checklist

1. Generate strong JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Set `NODE_ENV=production` and secure secrets in server/.env

3. Build client:
```bash
npm run build
```

4. Use a process manager (PM2) for the server:
```bash
pm2 start server/src/index.js --name nocturne-server
```

5. Serve client build with nginx or similar reverse proxy

### Photo Storage (Cloudinary — wired up ✅)

Real uploads are implemented. The Onboarding and Profile pages upload selected
files to `POST /api/users/me/photos/upload`, which stores them in your
Cloudinary account (auto-resized to max 1080×1350, folder
`nocturne/<userId>`) and returns a CDN `secure_url` that gets saved in
`User.photos`. If Cloudinary is unconfigured or an upload fails, the app falls
back to local previews so users are never blocked.

Seeded demo users use real goth-culture portraits hosted in your Cloudinary
account (folder `nocturne/stock`, 14 femme + 10 masc CC-BY/SA portraits sourced
via Openverse). To re-upload/refresh the set: `npm run upload-stock
--workspace=server` (reads `server/src/stockCandidates.json`, writes the URL
manifest to `server/src/stockPhotos.js`, which `seed.js` consumes). Seed users
are clustered around Salem/Boston/Providence so everyone falls inside the
default 100km radius and the swipe deck is full. Photo credits are listed in
`stockPhotos.js` (`STOCK_CREDITS`).

Required env vars in `server/.env` (see `server/.env.example`):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

New endpoint:
- `POST /api/users/me/photos/upload` — body `{ image: <data URL> }` →
  `{ url }` (201). Returns 503 if Cloudinary isn't configured.

Alternative: AWS S3 + CloudFront (env vars would be `AWS_S3_BUCKET`,
`AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_CLOUDFRONT_URL`) — same pattern, store the public file URL in
`User.photos`.

## License

MIT