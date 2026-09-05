## Project Brief

Build a **fullstack gothic-themed dating web application** called **"Nocturne"** (feel free to rename). It should feel like a polished, modern dating app (Tinder/Hinge-style swiping + matching + chat) but with a distinct dark, romantic-gothic aesthetic. Target demographics/orientations to support: **woman seeking woman, man seeking woman, woman seeking man** (i.e., straight and lesbian matching — no male+male matching needed, but store orientation/gender as flexible fields so it's easy to extend later).

## Tech Stack (required)

- **Frontend:** React (Vite), plain CSS (or CSS Modules) — no Tailwind/UI kit, since this needs a custom gothic look
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Real-time chat:** Socket.IO
- **Auth:** JWT (access token + refresh token) with bcrypt for password hashing

## Core Assumptions (act on these without asking)

- Single web app, responsive (mobile-first, since dating apps are primarily used on phones), but must work well on desktop too.
- Users register with email/password (no OAuth needed unless trivial to add later).
- Gender field: `man`, `woman`, `nonbinary` (store it, even if matching logic is initially limited to man/woman combos).
- Seeking/interested-in field: multi-select of the same gender options, so a woman can seek `woman`, `man`, or both.
- Matching logic: show User A profiles where User A's gender is in User B's `interestedIn` list AND vice versa (mutual visibility), respecting the target demographics above.
- Swipe right = like, swipe left = pass. A match occurs when both users swipe right on each other.
- Chat only unlocks after a match.
- Use placeholder/seeded data (via a seed script) — no real photo upload storage needed initially; use image URLs (e.g., placeholder avatar service) for profile photos, but structure the schema so real uploads (S3/Cloudinary) could be added later.
- No payment/subscription tiers needed — build the core free experience.
- No content moderation/AI safety pipeline needed for this build, but include basic block/report/unmatch functionality since that's standard and expected in dating apps.

## Feature Requirements

### 1. Auth & Onboarding
- Sign up (email, password, first name, birthdate → calculate age, gender, interestedIn)
- Multi-step onboarding: basic info → bio → interests/tags → upload/select photos (min 1, max 6) → location (city or lat/long, can be manually entered or mocked)
- Login / logout, JWT stored in httpOnly cookie or secure storage
- Protected routes on both frontend and backend

### 2. Discovery / Swipe Deck
- Card-stack UI showing one profile at a time: photo(s) carousel, name, age, short bio, distance (mock if needed), tags/interests
- Swipe right (like) / left (pass) via drag gesture AND buttons (for accessibility/desktop)
- Smooth animations (card fly-off, rotation on drag, undo last swipe as a bonus feature)
- Backend excludes already-swiped profiles and filters by mutual gender/interest criteria + age range preference
- "It's a Match!" modal/animation when mutual like occurs

### 3. Matches List
- List of all current matches with last message preview and timestamp
- Unmatch and block/report options per match

### 4. Real-time Chat
- Socket.IO powered 1:1 chat per match
- Persisted message history in MongoDB, loaded on chat open
- Typing indicators, read receipts (basic), online/last-seen status
- New message notifications (in-app badge/toast at minimum)

### 5. Profile Management
- Edit bio, photos, interests, preferences (age range, gender preference, max distance)
- Account settings: change password, delete account

### 6. Gothic Visual Theme (be deliberate and specific here)
- **Palette:** deep blacks (#0a0a0d), charcoal, blood/wine red accent (#7a1f2b or similar), muted purple/violet accents, off-white/bone text (#e8e3dd) — avoid pure white
- **Typography:** elegant serif or blackletter-inspired display font for headings (e.g., a Google Font like "Cinzel," "Cormorant Gothic," or "UnifrakturCook" used sparingly for logo/headers), clean readable serif or sans-serif for body text
- **Motifs:** subtle ornamental borders/dividers, candle-flicker or fog-like ambient background effects (CSS gradients/animations, keep performant), thin filigree line-art accents, dark glassmorphism cards with red/purple glow on hover
- **Iconography:** replace generic heart icons with gothic-appropriate alternatives (e.g., a dagger/heart hybrid, ravens, roses, moon phases) — use a free icon set like Lucide/Phosphor and restyle, or simple custom SVGs
- **Micro-interactions:** buttons with subtle glow/pulse on hover, page transitions with fade/mist effect
- Keep it usable and accessible (sufficient contrast, not overly busy) — gothic aesthetic should enhance, not sacrifice UX

## Data Models (Mongoose — implement these, adjust as needed)

- **User**: email, passwordHash, firstName, birthdate, gender, interestedIn[], bio, photos[], interests[], location {city, lat, lng}, preferences {minAge, maxAge, maxDistance}, createdAt
- **Swipe**: swiperId, swipedId, direction ('like' | 'pass'), createdAt
- **Match**: user1Id, user2Id, matchedAt, unmatchedAt (nullable)
- **Message**: matchId, senderId, content, sentAt, readAt (nullable)
- **Block/Report**: reporterId, reportedId, reason, createdAt

## API Structure (Express — REST + Socket.IO)

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `GET/PUT /api/users/me`, `POST /api/users/me/photos`
- `GET /api/discover` (returns next batch of candidate profiles)
- `POST /api/swipes` (body: swipedId, direction) → returns `{ match: boolean, matchId? }`
- `GET /api/matches`, `DELETE /api/matches/:id` (unmatch)
- `GET /api/matches/:id/messages`
- `POST /api/reports`
- Socket.IO namespace/events: `join_match_room`, `send_message`, `receive_message`, `typing`, `stop_typing`, `read_receipt`, `presence_update`

## Build Instructions for the Agent

1. Set up project structure: `/client` (React + Vite) and `/server` (Express) as separate workspaces, or a monorepo — your choice, but keep it clean and documented.
2. Set up MongoDB connection via Mongoose (use env var `MONGODB_URI`, default to local `mongodb://localhost:27017/nocturne` if not set).
3. Implement backend first: models → auth → discovery/swipe/match logic → chat REST endpoints → Socket.IO chat layer. Write basic input validation on all routes.
4. Implement frontend: routing (React Router), auth context, onboarding flow, swipe deck (use a library like `react-tinder-card` or build custom drag logic with `framer-motion` — your call, document the choice), matches list, chat UI with Socket.IO client, profile/settings pages.
5. Apply the gothic theme consistently across all screens via a shared CSS design system (CSS variables for colors/fonts, a base stylesheet, reusable component classes).
6. Write a `seed.js` script that populates the DB with ~15-20 realistic mock users (varied genders/orientations matching the target demographics) with placeholder photos, so the swipe deck and matching are testable immediately.
7. Include a root-level `README.md` with setup instructions (env vars needed, how to run client/server, how to seed the DB, default ports).
8. Add a `.env.example` for both client and server.
9. Test the critical flow end-to-end yourself before finishing: signup → onboarding → swipe → mutual match → chat message sent and received in real time between two seeded/test accounts.

## Definition of Done

- `npm run dev` (or documented equivalent) starts both client and server successfully
- A new user can sign up, complete onboarding, and see a swipe deck of eligible profiles filtered by gender/interest
- Swiping produces matches when mutual, with a visible match celebration UI
- Matched users can exchange real-time messages that persist and reload correctly
- The entire UI consistently reflects the gothic theme described above
- No console errors in normal usage; basic error states (empty deck, failed login, etc.) are handled gracefully

Ask me clarifying questions only if something above is genuinely ambiguous or blocking — otherwise make reasonable assumptions and proceed.
