# KOLABORIN: Product Requirements Document (PRD) v2

**Version:** 2.0 (hackathon prototype)  
**Team:** IA (Ijazah Asli)  
**Status of this document:** this PRD is the **single source of truth**. No other spec, schema, or mockup file will be provided. The only extra asset is the **KOLABORIN logo** (Section 9.4). Everything needed to build the prototype (data model, API, rules, UI layout, seed data, demo script) is inside this file.

---

## 0. Instructions for the AI coding assistant

1. Read the whole PRD before writing code.
2. Build **one milestone at a time** (Section 14). After each milestone: list files created or changed, give exact commands to run, and give a short manual test checklist. **Wait for confirmation** before the next milestone.
3. This is a **prototype**. Prefer simple, readable code. No ORM, no microservices, no over-engineering.
4. Business rules and permissions are enforced **on the server**. The frontend only reflects them.
5. If something is ambiguous, pick the simplest option that satisfies the acceptance criteria and write the assumption in a code comment.
6. Do not build anything listed in Section 13 (out of scope).
7. Priorities: **P0** = must work for the demo, **P1** = should work, **P2** = only if time remains.
8. **Key prototype decisions (do not change):**
   - The Community Hub chat uses **simple rule-based (if/else) auto-replies**, not Socket.IO or real-time sockets (Section 5.7 and Appendix B).
   - The **Home page contains a live map preview**; clicking it opens the full Map page (Section 5.2).

---

## 1. Product overview

**KOLABORIN** ("Lebih Banyak Koneksi, Lebih Berkolaborasi", "More Connections, More Collaboration") is a campus web platform that connects study groups, communities, verified student organizations, events, and study locations on one live map.

**Problem:** students struggle to find study partners, places to study, and communities; organizations struggle to promote events and find collaborators. These activities are scattered across WhatsApp, Instagram, and Google Maps.

**Solution:** one web app where students find study groups on a live map, join communities, apply to events, and earn recognition; and where verified organizations publish events, run communities, and collaborate.

**Competition context:** GDG on Campus ITB, STACK 2026, Case 1: Smarter Campus and Learning.

### 1.1 Goals
- G1. A flawless 3-minute demo of the core journey (Section 12).
- G2. Show the three differentiators: **live activity map**, **verification (organizations and places)**, **fair recognition (capped points, moderator-approved badges)**.
- G3. Runs locally with seeded data, stable and fast.

### 1.2 Non-goals
See Section 13.

---

## 2. Users, roles, and permissions

| Role | How obtained | Description |
|---|---|---|
| **Student** | Register | Default role. Joins groups and communities, applies to events, requests places, can register an organization. |
| **Org Owner** | A student who owns a row in `organizations` | Not a separate account type; derived from `organizations.owner_id`. Organization powers apply only when that organization is `verified`. |
| **Admin** | `users.role = 'admin'` (seeded) | Verifies organizations and places, approves badges. |

### 2.1 Permission matrix

| Action | Student | Org Owner (verified org) | Org Owner (pending org) | Admin |
|---|---|---|---|---|
| Register, login, view Home | Yes | Yes | Yes | Yes |
| View map, places, groups, events, communities | Yes | Yes | Yes | Yes |
| Create and join study groups | Yes | Yes | Yes | No |
| Post questions/answers in a joined group | Yes | Yes | Yes | No |
| Join communities and use chat | Yes | Yes | Yes | No |
| Create a student community (no organization) | Yes | Yes | Yes | No |
| Create a community for an organization | No | Yes | No | No |
| Request a new place | Yes | Yes | Yes | No |
| Register an organization (status `pending`) | Yes | Yes | Yes | No |
| Publish an event | No | Yes (own org) | **No** | No |
| Accept/reject event applicants | No | Yes (own events) | No | No |
| Apply to an event | Yes | Yes (not own org's) | Yes | No |
| Toggle `open_for_collab`, collab requests | No | Yes | No | No |
| Verify/reject organizations and places; approve badges | No | No | No | Yes |

---

## 3. Tech stack and constraints

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Axios, `leaflet` + `react-leaflet`. Plain CSS with CSS variables (no UI framework). |
| Backend | Node.js 18+, Express.js, `mysql2/promise` (plain SQL), `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`. Optional: `zod`. |
| Database | MySQL 8 (the leaderboard view uses `RANK() OVER`). |
| Map | OpenStreetMap tiles through Leaflet. No API key. |
| Chat | **Rule-based auto-reply service in the backend** (no Socket.IO). |
| Run mode | Local only. `server` on port 4000, `client` (Vite) on port 5173. |
| Timezone | Server and DB connection use `Asia/Jakarta` (`+07:00`) so daily caps reset at local midnight. |

### 3.1 Repository layout

```
kolaborin/
  README.md                 # setup + demo accounts + how to run
  server/
    package.json
    .env.example            # PORT=4000, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME=kolaborin, JWT_SECRET, CLIENT_ORIGIN=http://localhost:5173
    src/
      index.js              # starts the server
      app.js                # express app, middleware, route mounting
      db.js                 # mysql2 pool (timezone '+07:00')
      middleware/ auth.js, requireRole.js, errorHandler.js
      routes/ auth.js, home.js, locations.js, placeRequests.js, groups.js,
              orgs.js, communities.js, events.js, collab.js, leaderboard.js,
              badges.js, admin.js
      services/ points.js, badges.js, headcount.js, chatbot.js
    db/
      schema.sql            # Appendix A (copy exactly)
      seed.js               # Section 11
  client/
    package.json
    .env.example            # VITE_API_URL=http://localhost:4000/api, VITE_MAP_LAT, VITE_MAP_LNG
    public/
      logo.png              # KOLABORIN logo (provided by the team)
    index.html              # favicon -> /logo.png
    src/
      main.jsx, App.jsx, api.js, styles.css, theme.js, strings.js
      auth/ AuthContext.jsx, ProtectedRoute.jsx
      pages/ Login, Register, Home, MapPage, Party, GroupDetail, NewGroup,
             Communities, CommunityRoom, Events, EventDetail, OrgNew,
             OrgManage, Collab, Leaderboard, Profile, Admin
      components/ Navbar, Card, Modal, Toast, PlaceMap, LiveTag, Logo
```

### 3.2 Conventions
- JSON everywhere. Errors: `{ "error": "Readable message" }` with the right status (400 validation, 401 not logged in, 403 forbidden, 404 not found, 409 conflict, 500 unexpected). Never return stack traces.
- Auth header: `Authorization: Bearer <JWT>`. JWT payload `{ id, role }`, expiry 7 days.
- Passwords: `bcryptjs`, cost 10. **Never** return `password_hash`.
- Parameterised SQL only (`?`). Never concatenate user input into SQL.
- Use transactions for: join group, organization verification, place approval, event application acceptance, and anything that awards points.
- Dates in API: ISO 8601 strings.
- UI language: **English** by default. Keep all UI strings in `client/src/strings.js`.

---

## 4. Data model

The full schema is in **Appendix A**. Summary (17 tables + 1 view):

| Area | Tables |
|---|---|
| Identity | `users` |
| Organizations | `organizations`, `collaboration_requests` |
| Places | `locations`, `place_requests` |
| Study groups | `study_groups`, `study_group_members`, `group_posts` |
| Community | `communities`, `community_members`, `community_messages` |
| Events | `events`, `event_applications` |
| Gamification | `point_rules`, `point_transactions`, `badges`, `user_badges`, view `leaderboard` |

Constraints to enforce in code: unique `(event_id, user_id)` on applications; unique ticket codes for events and study groups; one-time check-in recorded by `checked_in_at` and `checked_in_by`; unique `(user_id, badge_id)` on user badges; composite primary keys on membership tables (joining twice returns 409).

---

## 5. Functional requirements

Each requirement has an ID, priority, and acceptance criteria (AC).

### 5.1 Authentication and profile (M1)

**FR-AUTH-1 (P0) Register.** Fields: `name`, `email`, `password` (min 8 characters), `faculty`, `major`. Role is always `student`. AC: duplicate email returns 409; password stored hashed; returns `{ token, user }`.

**FR-AUTH-2 (P0) Login.** Email and password. AC: wrong credentials return 401 with a generic message; returns `{ token, user }`.

**FR-AUTH-3 (P0) Current user.** `GET /api/me` returns the user plus `rank`, approved `badges`, `ownedOrgs` (id, name, status), and `todayCaps` (points earned today per action vs the cap).

**FR-AUTH-4 (P1) Profile page** shows name, faculty/major, total points, today's cap usage, badge progress, and earned badges.

### 5.2 Home dashboard with map preview (M2)

**FR-HOME-1 (P0) Role-aware Home.** After login, `/` is Home. `GET /api/home` returns the data. Home must not need new tables.

**Student Home layout (top to bottom):**
1. **Hero banner:** "Hi, {firstName}" plus a one-line campus summary ("{N} people are studying right now") and 3 quick actions: *Create Study Group*, *Find Place*, *Request a Place*.
2. **Stats row (3 cards):** total points, leaderboard rank, badge progress bar (answers toward the badge).
3. **Live map preview card (full width):** see FR-HOME-2.
4. **Card grid:** *Busiest now* (top 3 places), *Groups for you* (up to 3 joinable upcoming groups with a Join button), *Upcoming events* (next 3 with Apply / status), *My communities* (joined communities with last message preview), *Top 3 this week*.

**Org Owner section** (shown above the map card if the user owns at least one organization): per organization: name, verification status banner (pending/verified/rejected), number of published events, pending applicants, pending collaboration requests, and quick actions (Create Event, Find Collaborators, Find Venue).

**Admin Home:** counts of pending organizations, pending place requests, pending badges; platform totals (users, groups, events); links into `/admin`. (No map preview required.)

AC: every card has a friendly empty state; joining a group or applying to an event from Home updates the page without a full reload; each card has a "see all" link to its page.

**FR-HOME-2 (P0) Map preview.** A card titled "Live campus map" showing a **mini Leaflet map** (height about 280 px, 220 px on phones):
- Shows all active locations as markers with the live headcount number (same data and component as the Map page, `PlaceMap` with `mini` mode).
- Mini mode is **non-draggable and non-zoomable** (disable dragging, scroll wheel zoom, double click zoom, touch zoom, box zoom, keyboard), so scrolling the page never gets stuck inside the map.
- **Hover** a marker: tooltip with place name and "N people studying now".
- **Click a marker:** navigate to `/map?place=<id>` (Map page opens with that place selected).
- **Click anywhere else on the map** (or the "Open full map" button in the card header): navigate to `/map`.
- Under the map: summary text "{N} people studying across {M} places" and a "Open full map" link.
- Refreshes every 30 seconds while Home is open.

AC: from Home, one click on the preview opens the Map page; a click on a marker opens the Map page with that place already selected and its side panel open.

### 5.3 Map and places (M3)

**FR-MAP-1 (P0) Live map.** `/map` shows an OpenStreetMap map centered on `VITE_MAP_LAT/LNG` (zoom 16), one marker per active location, from `GET /api/locations/live`. Includes OpenStreetMap attribution. If the URL has `?place=<id>`, select that place on load.

**FR-MAP-2 (P0) Hover and click.** Hover a marker: **Tooltip** with place name, short description, "N people studying now". Click a marker: highlight it and open the **side panel** (below the map on phones) with details and the groups at that place (title, subject, time, members/max) with a Join button per group. (Use Tooltip for hover and the side panel/Popup for click, because a popup closes on mouse-out and cannot hold clickable buttons.)

**FR-MAP-3 (P0) Live numbers** refresh every 30 seconds and after the user joins or creates a group.

**FR-MAP-4 (P0) Request a place.** Button "Request a Place" puts the map in pick mode (banner "Click the map to choose the location"). After a click, a modal asks: name (required), type (`study_spot`, `meeting_room`, `event_venue`), address (optional), short description (max 200 characters). Submit calls `POST /api/place-requests`. The requester sees their own pending requests as grey dashed markers labelled "pending".

**FR-MAP-5 (P0) Admin approves places.** Approval inserts a row into `locations` (copying owner and organization) in a transaction; it appears on the map on the next refresh. Rejection only updates the request status.

**FR-MAP-6 (P2) Type filters** for markers.

### 5.4 Open Party: study groups (M3)

**FR-PARTY-1 (P0) List and filter.** `/party` lists open/full upcoming groups: title, subject, place, time, member progress bar, Join and "Open space" buttons. Optional subject filter.

**FR-PARTY-2 (P0) Create group.** Fields: title, subject, description, location (select from active locations), scheduled time, max members (2 to 20, default 8). Creator is auto-added as a member. Status `open`.

**FR-PARTY-3 (P0) Join.** In a transaction: lock the group row (`SELECT ... FOR UPDATE`); reject with 409 if already a member, full, or closed; insert membership; set status `full` when members equal `max_members`; call `awardPoints(join_group)`. Return `{ group, points }`.

**FR-PARTY-4 (P1) Leave group.** Member can leave; status returns to `open` if it was `full`. Creator cannot leave (may close).

**FR-PARTY-5 (P0) Group space** `/groups/:id`: visible to all logged-in users; **posting only for members**. Shows group info, members (with approved badge icons), and Q and A: questions (`type=question`) with nested answers (`parent_id`). Members can post a question, an answer (awards `answer_post` points), or a note (no points).

**FR-PARTY-6 (P1) Close group** (creator): status `closed`, disappears from map and lists.

**FR-PARTY-7 (P1) Open Party check-in.** A group member can retrieve and display a single-use QR ticket. The group creator validates it with the live camera scanner, a QR image, or a manual ticket code. Only a member's valid ticket for that group can be checked in; successful and rejected scans show clear feedback, and a ticket cannot be used twice.

### 5.5 Organizations and verification (M4)

**FR-ORG-1 (P0) Register organization.** Any student: name, description, category. Created with `status='pending'`. The organization page shows a banner "Pending verification: you cannot publish events yet."

**FR-ORG-2 (P0) Admin verification.** Approve sets `status='verified'`, `verified_by`, `verified_at`. Reject sets `status='rejected'`.

**FR-ORG-3 (P0) Organization page** `/orgs/:id`: name, description, category, verified tick, upcoming events, community link, "Open for collaboration" tag.

**FR-ORG-4 (P1) Manage page** `/orgs/:id/manage` (owner): edit description, toggle `open_for_collab` (only if verified), create community, create event, see applicants per event.

**FR-ORG-5 (P1) Organization introduction page** `/organization-profile` (public): a landing page explains organization features and workflow, with clear registration and login links. The landing page's "Pelajari Fitur Organisasi" action opens this page.

### 5.6 Events (M4)

**FR-EVT-1 (P0) Publish.** Verified org owner only. Fields: title, description, location (optional), start time, end time (optional), capacity (optional). Status `published`. The server returns 403 if the organization is not `verified` or the caller is not the owner.

**FR-EVT-2 (P0) Browse and detail.** `/events` lists published upcoming events (soonest first) with organization name and verified tick. `/events/:id` shows details, a link to the place on the map, and an Apply button or status.

**FR-EVT-3 (P0) Apply.** Any logged-in student except the owner of the event's organization. Optional message. Creates an application with `status='pending'`. Duplicate returns 409.

**FR-EVT-4 (P0) Review applicants.** The event owner sees applicants (name, faculty, message, status) and accepts or rejects. Accept fails with 409 when accepted count already equals `capacity`. The student sees the updated status.

**FR-EVT-5 (P1) Reward.** When an application becomes `accepted`, award `attend_event` points once per event.

**FR-EVT-6 (P1) Event ticket QR.** An accepted applicant can retrieve and display a unique QR ticket from `/events/:id`; the QR can be enlarged for scanning. Ticket access is unavailable to other applicants and event owners.

**FR-EVT-7 (P1) Event check-in.** The event owner validates accepted applicants using the live camera scanner, a QR image, or a manual 64-character ticket code. A successful scan records `checked_in_at` and `checked_in_by` and gives clear feedback. The event must be published; invalid, unaccepted, already-used, or wrong-event tickets are rejected.

### 5.7 Community Hub: rule-based chat (M5)

**Design decision:** chat is **not** real-time. The user sends a message; the server saves it, runs the **rule-based responder** (`services/chatbot.js`, Appendix B), saves the auto-reply as a message from the community's persona user, and returns both. The client shows a short "typing..." indicator (600 to 1000 ms) before showing the reply, so it feels like a conversation. There is no Socket.IO and no polling requirement.

**FR-COM-1 (P0) Browse and join.** `/communities` lists communities (name, description, organization tag with verified tick, member count). Join inserts membership (409 if already a member).

**FR-COM-2 (P0) Create.** A student creates a community without an organization. A verified org owner can link it to their organization. The creator becomes `admin` member.

**FR-COM-3 (P0) Chat room** `/communities/:id` (members only):
- On open: load the last 50 messages (`GET /api/communities/:id/messages`).
- Message box (max 500 characters). On send, call `POST /api/communities/:id/messages`.
- The user's message appears immediately (optimistic); the auto-reply appears after the typing indicator. Own messages are right-aligned; persona messages left-aligned with the persona name.
- Footer note in small text: "Prototype chat: replies are automatic."
- Seeded history already contains a few messages so the room never looks empty.

**FR-COM-4 (P0) Rule-based responder.** Implement exactly as specified in Appendix B (ordered keyword rules, English and Indonesian, context-aware answers using database data, fallback reply).

**FR-COM-5 (P1) Broadcast.** Community admins can send a message with `isBroadcast: true`; it is highlighted as an announcement and **does not trigger an auto-reply**. The latest broadcast shows in the community's Home preview.

**FR-COM-6 (P1) Message points.** A user message awards `send_message` points (1 point, daily cap 10). Auto-replies never award points.

### 5.8 Points, leaderboard, badges (M6)

**FR-PTS-1 (P0) Points engine.** One function `awardPoints(conn, userId, actionType, { groupId })` used by every feature (Section 8.1).

**FR-PTS-2 (P0) Leaderboard.** `/leaderboard` ranks students by `total_points` (use the `leaderboard` view) and highlights the current user. Top 3 also feed Home.

**FR-BDG-1 (P1) Badge eligibility.** After an answer is posted, check criteria (Section 8.2). If met and no record exists, create `user_badges` with `status='pending'`.

**FR-BDG-2 (P1) Moderator approval.** Admin sees pending badges and approves or rejects. Approved badges show on the profile and next to the user's name in group member lists.

### 5.9 Open for Collaboration (M7, P2)

**FR-COL-1 (P2)** Verified org owners toggle `open_for_collab`. `/collab` lists organizations with that flag (excluding the user's own). Owner sends a request with a message; the receiving owner sees an inbox and accepts or declines. If time is short, seed a few requests and show a read-only list.

### 5.10 Admin panel (M4)

**FR-ADM-1 (P0)** `/admin` (admin only) with three tabs: **Organizations**, **Places**, **Badges**. Each lists pending items with details and Approve / Reject buttons. After an action the item leaves the queue and a toast confirms.

---

## 6. API specification

Base path `/api`. "Auth" means a valid JWT is required.

### 6.1 Auth and profile
| Method | Path | Auth | Body / notes | Success |
|---|---|---|---|---|
| POST | `/auth/register` | No | `{name,email,password,faculty,major}` | 201 `{token,user}` |
| POST | `/auth/login` | No | `{email,password}` | 200 `{token,user}` |
| GET | `/me` | Yes | | `{user, rank, badges[], ownedOrgs[], todayCaps{}}` |
| GET | `/users/:id` | Yes | public profile, no email | 200 |
| GET | `/health` | No | | `{ok:true}` |

### 6.2 Home
`GET /home` (Auth). Student payload:
```json
{
  "me": {"name":"", "points":0, "rank":0,
         "badgeProgress":{"subject":"Database Systems","answers":2,"needed":5}},
  "summary": {"peopleStudying":0, "placesActive":0},
  "busiestPlaces": [{"id":1,"name":"","short_description":"","active_people":5}],
  "recommendedGroups": [{"id":1,"title":"","subject":"","scheduled_at":"","members":4,"max_members":6,"location_name":""}],
  "upcomingEvents": [{"id":1,"title":"","org_name":"","start_at":"","myStatus":null}],
  "myCommunities": [{"id":1,"name":"","lastMessage":{"author":"","content":""}}],
  "top3": [{"name":"","total_points":0}],
  "orgs": [{"id":1,"name":"","status":"verified","publishedEvents":2,"pendingApplicants":3,"pendingCollab":1}]
}
```
Admin payload: `{ "pending": {"orgs":0,"places":0,"badges":0}, "totals": {"users":0,"groups":0,"events":0} }`.  
The Home map preview uses `GET /locations/live` (below), not the `/home` payload.

### 6.3 Locations and place requests
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/locations/live` | Yes | Active locations with `id,name,type,short_description,latitude,longitude,active_groups,active_people` (Section 8.3) |
| GET | `/locations` | Yes | Plain list for dropdowns |
| POST | `/place-requests` | Yes | `{name,type,address?,latitude,longitude,short_description?,organization_id?}` → 201 |
| GET | `/place-requests/mine` | Yes | Own requests with status (for grey pending markers) |
| GET | `/admin/place-requests/pending` | Admin | |
| PATCH | `/admin/place-requests/:id` | Admin | `{action:"approve"\|"reject"}`; approve inserts into `locations` in the same transaction |

### 6.4 Study groups
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/groups` | Yes | Query `subject?`, `location?`; open/full, soonest first |
| POST | `/groups` | Yes | `{title,subject,description?,location_id,scheduled_at,max_members?}` |
| GET | `/groups/:id` | Yes | Group, location, members (with approved badges), `isMember` |
| POST | `/groups/:id/join` | Yes | 201 `{group, points}`; 409 if full/duplicate |
| DELETE | `/groups/:id/join` | Yes | Leave (P1) |
| PATCH | `/groups/:id` | Creator | `{status:"closed"}` (P1) |
| GET | `/groups/:id/posts` | Yes | Questions with nested answers |
| POST | `/groups/:id/posts` | Member | `{type:"question"\|"answer"\|"note", content, parent_id?}`; answers need a `parent_id` question in the same group; returns `{post, points, badgeRequested}` |
| GET | `/groups/:id/ticket` | Group member | Returns the member's QR ticket |
| POST | `/groups/:id/check-ins` | Group creator | `{ticket_code}`; validates a member's one-time ticket for that group |

### 6.5 Organizations
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/orgs` | Yes | `{name,description,category}` → status `pending` |
| GET | `/orgs` | Yes | Verified organizations (`?openForCollab=1` supported) |
| GET | `/orgs/:id` | Yes | Public detail incl. events and community |
| PATCH | `/orgs/:id` | Owner | `{description?, open_for_collab?}` |
| GET | `/admin/orgs/pending` | Admin | |
| PATCH | `/admin/orgs/:id` | Admin | `{action:"verify"\|"reject"}` |

### 6.6 Events
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/events` | Yes | Published, upcoming |
| GET | `/events/:id` | Yes | Detail + `myApplication` + counts |
| GET | `/events/:id/ticket` | Accepted applicant | Returns the applicant's unique QR ticket |
| POST | `/events` | Verified org owner | `{organization_id,title,description,location_id?,start_at,end_at?,capacity?}`; 403 otherwise |
| POST | `/events/:id/apply` | Yes | `{message?}`; 409 duplicate; 403 if caller owns the organization |
| GET | `/events/:id/applications` | Event owner | Applicants |
| PATCH | `/applications/:id` | Event owner | `{action:"accept"\|"reject"}`; capacity check; awards `attend_event` on accept |
| POST | `/events/:id/check-ins` | Event owner | `{ticket_code}`; validates one accepted ticket for this event and records the check-in once |

### 6.7 Communities and chat
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/communities` | Yes | With `memberCount`, `isMember` |
| POST | `/communities` | Yes | `{name,description,category,organization_id?}`; `organization_id` requires verified ownership |
| POST | `/communities/:id/join` | Yes | 409 if already member |
| GET | `/communities/:id/messages` | Member | Query `limit` (default 50); oldest first |
| POST | `/communities/:id/messages` | Member | `{content, isBroadcast?}` → 201 `{message, reply, points}`; `reply` is `null` for broadcasts or if no rule applies |

### 6.8 Collaboration (P2)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/collab-requests` | Verified org owner | `{from_org_id,to_org_id,message}`; target must have `open_for_collab` |
| GET | `/collab-requests/inbox` | Org owner | Requests to organizations the user owns |
| PATCH | `/collab-requests/:id` | Receiving owner | `{action:"accept"\|"decline"}` |

### 6.9 Leaderboard and badges
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/leaderboard` | Yes | Top 20 students plus the caller's own row |
| GET | `/users/:id/badges` | Yes | Approved badges |
| GET | `/admin/badges/pending` | Admin | Include user name, badge name, answer count |
| PATCH | `/admin/badges/:id` | Admin | `{action:"approve"\|"reject"}` |

### 6.10 Error handling for every endpoint
Missing/invalid token → 401. Not allowed → 403. Unknown id → 404. Invalid body → 400 with a clear message. `ER_DUP_ENTRY` → 409 with a friendly message.

---

## 7. (Removed) Real-time

Socket.IO is **not used** in this prototype. Chat behaviour is defined in Section 5.7 and Appendix B. Keep chat logic inside `services/chatbot.js` and the messages route so that real-time sockets can be added later without changing the data model.

---

## 8. Business rules and algorithms

### 8.1 Points engine (`services/points.js`)
Seeded `point_rules`:

| action_type | points | daily_cap_points |
|---|---|---|
| join_group | 5 | 15 |
| answer_post | 10 | 50 |
| send_message | 1 | 10 |
| attend_event | 20 | 40 |

`awardPoints(conn, userId, action, {groupId})`:
1. Read the rule; if missing return `{awarded:0}`.
2. `todaySum` = sum of `points` in `point_transactions` for the user and action where `DATE(created_at) = CURDATE()`.
3. `remaining = daily_cap_points - todaySum`; if `remaining <= 0` return `{awarded:0, capped:true}`.
4. `award = MIN(rule.points, remaining)`.
5. Insert a `point_transactions` row and `UPDATE users SET total_points = total_points + award`.
6. Return `{awarded, capped: award < rule.points, total}`.

Run in the same transaction as the triggering action. **`total_points` is updated only here.** The API returns the result so the UI shows "+10 points" or "Daily limit reached".

Anti-abuse: leaving and rejoining the same group gives no new points (check for an existing `join_group` transaction with that `group_id`); answers shorter than 10 characters earn no points; answering your own question earns no points.

### 8.2 Badge eligibility (`services/badges.js`)
Seeded badge: "Database Systems Expert", subject "Database Systems", `min_answers = 5`. After a new answer, count `group_posts` with `type='answer'` by the user in groups whose `subject` equals the badge subject. If the count is at least `min_answers` and no `user_badges` row exists, insert it as `pending` and return `badgeRequested: true`. Only an admin can approve.

### 8.3 Live headcount (`services/headcount.js`)
A group is "active now" if `status IN ('open','full')` and `scheduled_at` is between `NOW() - 3 hours` and `NOW() + 1 hour`. Query for `/locations/live`:

```sql
SELECT l.id, l.name, l.type, l.short_description, l.latitude, l.longitude,
       COUNT(DISTINCT g.id) AS active_groups,
       COUNT(m.user_id)     AS active_people
FROM locations l
LEFT JOIN study_groups g
       ON g.location_id = l.id
      AND g.status IN ('open','full')
      AND g.scheduled_at BETWEEN NOW() - INTERVAL 3 HOUR AND NOW() + INTERVAL 1 HOUR
LEFT JOIN study_group_members m ON m.group_id = g.id
WHERE l.is_active = TRUE
GROUP BY l.id;
```
This is an estimate derived from group membership, not tracking. The UI says "N people studying now".

### 8.4 Verification gates
Event creation, organization-linked communities, and collaboration require an organization with `status='verified'` owned by the caller. Place requests need admin approval but not organization verification.

### 8.5 Capacity
Group join: lock the group row and compare the member count with `max_members`. Event accept: lock the event row and compare the accepted count with `capacity` (when not null).

---

## 9. Frontend requirements

### 9.1 Routes
| Route | Page | Access |
|---|---|---|
| `/login`, `/register` | Auth | Public |
| `/` | Home (with map preview) | Logged in |
| `/map` (`?place=<id>`) | Live map and place request | Logged in |
| `/party`, `/groups/new`, `/groups/:id` | Open Party | Logged in |
| `/communities`, `/communities/:id` | Community Hub (rule-based chat) | Logged in |
| `/events`, `/events/:id` | Events | Logged in |
| `/orgs/new`, `/orgs/:id`, `/orgs/:id/manage` | Organizations | Logged in (manage: owner) |
| `/organization-profile` | Organization feature introduction | Public |
| `/collab` | Collaboration (P2) | Verified org owner |
| `/leaderboard`, `/profile/:id` | Gamification | Logged in |
| `/admin` | Admin panel | Admin |

Unauthenticated users go to `/login`; after login go to `/`. Navbar: logo (links to Home), Home, Map, Open Party, Communities, Events, Leaderboard, Profile; plus Admin for admins and "My Organization" for owners. The user's points total is always visible in the navbar.

### 9.2 Page layouts (visual guidance)
- **Navbar:** sticky top; logo left, tabs (horizontally scrollable on small screens), points pill right.
- **Home:** hero banner (gradient from `--primary` to a purple like `#7c3aed`, white text, 3 translucent action buttons), stats row, **map preview card**, then a responsive card grid (`repeat(auto-fill, minmax(260px, 1fr))`).
- **Map page:** two columns on desktop (map about 2/3, side panel 320 px), stacked on phones. Legend under the map: blue dot = place (number = people studying), orange = selected, grey dashed = pending request.
- **Open Party:** card grid; each card shows subject tag, title, place, time, member progress bar, buttons.
- **Group space:** header card (subject tag, title, place, time, members) and Q and A list with an input and "Send answer" button.
- **Community room:** list on `/communities`; room view with a scrollable message area (about 60vh), message bubbles, typing indicator, input row.
- **Events:** card grid with organization tag (verified tick), date, place, Apply / status button.
- **Leaderboard:** ordered list; current user's row highlighted.
- **Admin:** tabs with pending cards and Approve / Reject buttons.

### 9.3 Design tokens (CSS variables; define light and dark via `prefers-color-scheme`)
| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f4f6fb` | `#0f1420` |
| `--card` | `#ffffff` | `#192032` |
| `--text` | `#1b2233` | `#e8ecf6` |
| `--muted` | `#6b7488` | `#93a0ba` |
| `--primary` | `#2563eb` (or the logo's main colour, see 9.4) | `#6b9bff` |
| `--primary-soft` | `#e8efff` | `#223055` |
| `--accent` | `#f59e0b` | `#f59e0b` |
| `--ok` | `#16a34a` | `#16a34a` |
| `--border` | `#e3e7f0` | `#2a3550` |

Style: system font stack, card radius 14 px, buttons radius 8 px, bold small tags with soft background, thin progress bars in `--accent`, toast at the bottom center (dark pill). Leaflet tooltip styled as a small card (name bold, description, green "N people studying now").

### 9.4 Logo (provided by the team)
- File: `client/public/logo.png` (the team may supply `.svg`; support whichever exists, prefer SVG).
- Use it in: navbar (height 32 px, links to `/`), Login and Register pages (height about 56 px, centered above the form), and as favicon (`<link rel="icon" href="/logo.png">`). Optionally show it small in the Home hero.
- Do **not** redraw, recolour, stretch, or edit the logo. Keep aspect ratio. In dark mode, if the logo is not legible on a dark navbar, place it on a light rounded background chip.
- If the file is missing, fall back to a text wordmark "KOLABORIN" so the app still runs. Centralise this in `components/Logo.jsx`.
- Brand colour: put `BRAND_PRIMARY` in `client/src/theme.js` (default `#2563eb`); the team will set it to the logo's main colour if desired. `--primary` reads from it.

### 9.5 UI rules
- Responsive from 360 px phones to desktop.
- Every list has loading, empty (friendly message plus call to action), and error states.
- Buttons show a disabled/loading state while a request is running. Toasts for success and error; points toasts ("+5 points", "Daily limit reached").
- Forms validate on the client (required, lengths) and display server error messages.
- Map: fix the default Leaflet marker icons for Vite (import `marker-icon.png`, `marker-shadow.png`, set `L.Icon.Default` options, import `leaflet/dist/leaflet.css`). Marker shows the live headcount number; selected marker highlighted.
- `PlaceMap` props: `mini` (boolean), `places`, `selectedId`, `onSelect(id)`, `pendingPins`, `pickMode`, `onPick(latlng)`. Used by both Home and Map pages.
- Accessibility basics: semantic headings, input labels, visible focus, keyboard-operable buttons, adequate contrast.

### 9.6 State
`AuthContext` keeps the token (memory plus `localStorage` key `kolaborin_token`) and user. An Axios interceptor adds the token and redirects to `/login` on 401. Page state via hooks; refetch after mutations. No global store library.

---

## 10. Non-functional requirements

- **Security:** bcrypt hashing, JWT secret from env, parameterised SQL, CORS limited to `CLIENT_ORIGIN`, input length limits, render user content as plain text (no `dangerouslySetInnerHTML`).
- **Privacy:** collect only name, email, faculty, major, optional bio. No GPS tracking. Public profile hides email. Chat content visible to community members only.
- **Performance:** list endpoints return at most 50 rows by default; map payload under 200 places.
- **Reliability:** consistent JSON errors; DB pool with sensible limits.
- **Maintainability:** one route file per module, shared logic in `services/`, comments on non-obvious rules, a `README.md` with setup, run, and demo accounts.

---

## 11. Seed data (`db/seed.js`)

Run with `node db/seed.js` after loading `schema.sql`. Must be **re-runnable** (clear tables first). All demo accounts use password `Password123!` (hash with bcryptjs). Dates must be **relative to now** (for example `NOW() + INTERVAL 2 HOUR`) so the live map always shows activity.

| Account | Purpose |
|---|---|
| `admin@kolaborin.test` | Admin |
| `mikail@kolaborin.test` | Main demo student (STEI, Informatics). 120 points. Has exactly **4 answers** in Database Systems groups (so the 5th answer triggers the badge request). Member of HMIF Announcements |
| `farrel@kolaborin.test`, `raffi@kolaborin.test` | Students |
| `hima@kolaborin.test` | Owner of **HMIF** (verified) |
| `robotics@kolaborin.test` | Owner of **Robotics Club** (**pending**), for the verification demo |
| Rani, Dimas, Fajar, Sinta, Bagas (`<name>@kolaborin.test`) | Students filling the leaderboard (points 90 to 310) and acting as community personas |

Content:
- **6 locations** near the campus center (study spots, meeting rooms, one event venue) with short descriptions: Central Library, Labtek V Discussion Room, Canteen, West Hall, an outdoor park, a cafe. Use coordinates near `VITE_MAP_LAT/LNG` defaults (ITB Bandung area: about -6.8893, 107.6104); spread them within roughly 300 m.
- **1 pending place request** (so the admin queue is not empty).
- **12 study groups** across Database Systems, Calculus, Thermodynamics, Data Structures, and others. **At least 6 scheduled within the "active now" window** so the map and Home preview show live numbers (for example 3, 5, 4 people at different places). A few groups have members, questions, and answers.
- **3 organizations:** HMIF (verified, open for collaboration), one more verified organization, Robotics Club (pending).
- **3 communities** with 4 to 6 seeded messages each: HMIF Announcements (linked to HMIF, `bot_user_id` = a persona such as "HMIF Admin" user or `hima@`), Study Together STEI (persona Rani), Robotics Club (persona Dimas).
- **5 published future events** from verified organizations, with a few applications in different statuses.
- `point_rules` (Section 8.1) and the one badge. Seed `point_transactions` consistent with `users.total_points`.

---

## 12. Demo script (must work flawlessly)

1. Log in as **Mikail**. Land on **Home**: hero, stats, **map preview** with live numbers.
2. Hover a marker in the Home preview (tooltip). **Click the preview**: the Map page opens. Click a marker: side panel shows groups. **Join** "DB Midterm Prep" (+5 points toast).
3. Open the group space, post an answer (+10 points). Leaderboard rank rises.
4. Post the **5th** answer in Database Systems: "Badge requested". Log in as **admin**, approve it in the Badges tab. Mikail's profile shows the badge.
5. **Request a Place**: click the map, fill the form, submit (grey pending marker). As admin: approve in the Places tab. The new marker appears.
6. Log in as **robotics@** (pending): show the "Pending verification" banner and that publishing an event is blocked. As admin: verify the organization. Now publish an event.
7. As Mikail: apply to the event. As the owner: accept the application.
8. Open **Communities → HMIF Announcements** as Mikail. Type "hi" (greeting reply), "ada event apa?" (reply with the next real event from the database), "grup belajar database" (recommends a real group), "poin saya" (shows his points and rank), and a random sentence (fallback reply).
9. As Mikail: open the accepted event's QR ticket and enlarge it. As the event owner: scan it with the camera, upload a QR image, or enter its code; confirm success, then verify that a repeated or wrong-event ticket is rejected.

---

## 13. Out of scope (do not build)

Real-time sockets (Socket.IO/WebSocket); native mobile apps; push or email notifications; payments or paid ticketing; GPS tracking; general-purpose file/image uploads; multi-campus support; AI or LLM-based chat; analytics dashboards; password reset by email; social login; direct (1-to-1) messaging; cloud deployment.

---

## 14. Milestones and Definition of Done

| # | Milestone | Scope | Done when |
|---|---|---|---|
| **M0** | Setup | Repo layout, env files, DB from Appendix A, `seed.js` skeleton, server and client run, logo in place | `GET /api/health` returns ok; Vite app opens with the logo |
| **M1** | Auth | FR-AUTH-1..3, middleware, login/register pages, protected routes, navbar | Register, login, `/me` work; wrong role gets 403 |
| **M2** | Home + map preview | FR-HOME-1..2, `/locations/live`, `PlaceMap` component (mini mode), `/home` endpoint with real data and empty states | Home renders for student, org owner, admin; clicking the preview opens `/map` |
| **M3** | Map + Open Party | FR-MAP-1..5, FR-PARTY-1..5, points engine, place requests | Demo steps 2, 3, 5 work |
| **M4** | Orgs, events, admin | FR-ORG-1..5, FR-EVT-1..7, FR-ADM-1 | Demo steps 6, 7, 9 work |
| **M5** | Community Hub (rule-based chat) | FR-COM-1..4, `chatbot.js` | Demo step 8 works |
| **M6** | Points, leaderboard, badges | FR-PTS-1..2, FR-BDG-1..2, profile | Demo step 4 works; caps verified |
| **M7** | Polish and stretch | FR-COL-1, broadcast, filters, leave/close group, states, dark mode, README | Full demo script passes twice in a row |

### 14.1 Test checklist
- **Permissions:** a pending organization cannot publish an event (403); non-members cannot post in a group or read/send community messages; non-admins cannot reach `/api/admin/*`.
- **Rules:** full group rejects join; duplicate event application rejected; event capacity respected; daily cap stops points and shows "Daily limit reached"; leaving and rejoining gives no extra points.
- **QR check-in:** event and Open Party tickets are single-use and scoped to their event/group; only the event owner or group creator can validate them; pending applicants, invalid codes, wrong-event codes, and repeat scans are rejected.
- **Chat:** each rule in Appendix B returns the expected reply in English and in Indonesian; broadcasts get no reply; fallback works; auto-replies never award points.
- **Home preview:** non-draggable; tooltip on hover; marker click goes to `/map?place=<id>` with that place selected; other clicks go to `/map`.
- **Map:** headcount changes after joining a group; approved place appears; pending place visible only to its requester.
- **Security:** `password_hash` never appears in any response; SQL injection strings in text fields do not break queries.

---

## 15. Assumptions

- The default campus center is configurable (`VITE_MAP_LAT`, `VITE_MAP_LNG`); the seed uses coordinates near ITB Bandung.
- `bcryptjs` is used instead of native `bcrypt` to avoid compile issues; hashes are compatible.
- A user may own more than one organization; Home and the navbar handle the list.
- Event acceptance and attendance are separate: only accepted applicants can check in with a single-use event ticket.
- UI language is English; strings are centralised for a later Indonesian version.

---

## Appendix A: Database schema (MySQL 8). Save as `server/db/schema.sql` exactly

```sql
CREATE DATABASE IF NOT EXISTS kolaborin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kolaborin;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  faculty VARCHAR(100), major VARCHAR(100), bio TEXT,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(60),
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  open_for_collab BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE collaboration_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_org_id INT NOT NULL,
  to_org_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (to_org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('study_spot','meeting_room','event_venue') NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  description TEXT,
  short_description VARCHAR(200) NULL,
  owner_id INT NULL,
  organization_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE place_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  organization_id INT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('study_spot','meeting_room','event_venue') NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  short_description VARCHAR(200),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE study_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  location_id INT,
  scheduled_at DATETIME,
  max_members INT NOT NULL DEFAULT 8,
  status ENUM('open','full','closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_group_loc (location_id, status, scheduled_at),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE study_group_members (
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  ticket_code CHAR(64) NULL,
  checked_in_at DATETIME NULL,
  checked_in_by INT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id),
  UNIQUE KEY uq_group_ticket_code (ticket_code),
  INDEX idx_group_check_in (group_id, checked_in_at),
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE group_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  type ENUM('question','answer','note') NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES group_posts(id) ON DELETE CASCADE
);

CREATE TABLE communities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NULL,
  created_by INT NOT NULL,
  bot_user_id INT NULL,                 -- persona user that sends auto-replies
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (bot_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE community_members (
  community_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (community_id, user_id),
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE community_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  community_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN NOT NULL DEFAULT FALSE,
  is_auto_reply BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_time (community_id, created_at),
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  location_id INT,
  start_at DATETIME NOT NULL,
  end_at DATETIME,
  capacity INT,
  status ENUM('draft','published','cancelled') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE event_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  ticket_code CHAR(64) NULL,
  checked_in_at DATETIME NULL,
  checked_in_by INT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_user (event_id, user_id),
  UNIQUE KEY uq_event_ticket_code (ticket_code),
  INDEX idx_event_status (event_id, status),
  INDEX idx_event_check_in (event_id, checked_in_at),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE point_rules (
  action_type VARCHAR(40) PRIMARY KEY,
  points INT NOT NULL,
  daily_cap_points INT NOT NULL
);

CREATE TABLE point_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  points INT NOT NULL,
  group_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_day (user_id, action_type, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (action_type) REFERENCES point_rules(action_type),
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL
);

CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  min_answers INT NOT NULL DEFAULT 5
);

CREATE TABLE user_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approved_by INT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  UNIQUE KEY uq_user_badge (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE VIEW leaderboard AS
SELECT id AS user_id, name, faculty, total_points,
       RANK() OVER (ORDER BY total_points DESC) AS rank_no
FROM users WHERE role = 'student';
```

---

## Appendix B: Rule-based chat responder (`server/src/services/chatbot.js`)

**Purpose:** make the Community Hub feel conversational in the prototype using plain `if/else` logic. No LLM, no external API.

### B.1 Flow (`POST /communities/:id/messages`)
1. Verify the user is a member of the community (else 403). Validate `content` (1 to 500 characters after trimming).
2. Insert the user's message. If `isBroadcast` is true, the user must be a community `admin`; save and return `{message, reply:null}` (no auto-reply).
3. Call `getReply(content, ctx)` where `ctx = { user, community, db }`.
4. If a reply string is returned, insert it into `community_messages` with `user_id = community.bot_user_id` (fallback: `community.created_by`), `is_auto_reply = TRUE`, and a `created_at` about 1 second after the user's message.
5. (P1) Award `send_message` points for the user's message only.
6. Return `201 { message, reply, points }`.

### B.2 Matching
- Normalise: lowercase, remove punctuation, collapse spaces.
- Check rules **in the order below; the first rule with a matching keyword wins** (substring match on the normalised text, using word boundaries for short words such as "hi" and "hey").
- Each rule has English keywords (`en`) and Indonesian keywords (`id`). The reply language is the language of the matched keyword list (Indonesian if an `id` keyword matched, otherwise English). Fallback language: Indonesian if the message contains common Indonesian words (for example "yang", "aku", "saya", "gimana", "apa", "ada"), else English.
- Templates use these values: `{firstName}` (user's first name), `{community}` (community name).

### B.3 Rules (in order)

| # | Rule | Keywords (en / id) | Data lookup | Reply template (en / id) |
|---|---|---|---|---|
| 1 | greeting | hi, hello, hey, good morning / halo, hai, selamat pagi, selamat siang, selamat sore, selamat malam, assalamualaikum | none | "Hi {firstName}! Welcome to {community}. Ask me about events, study groups, places, or points." / "Halo {firstName}! Selamat datang di {community}. Tanya soal event, grup belajar, tempat, atau poin ya." |
| 2 | thanks | thanks, thank you, thx / makasih, terima kasih, thanks | none | "You're welcome!" / "Sama-sama!" |
| 3 | bye | bye, see you / dadah, sampai jumpa, duluan | none | "See you around, {firstName}!" / "Sampai jumpa, {firstName}!" |
| 4 | help | help, what can you do / bantuan, bisa apa, tolong | none | "I can tell you about upcoming events, study groups, busy places, your points and rank, badges, and organizations." / "Aku bisa kasih info event terdekat, grup belajar, tempat ramai, poin dan peringkatmu, badge, dan organisasi." |
| 5 | subject group | any subject name found in an open `study_groups.subject` (for example database, calculus / kalkulus, thermodynamics / termodinamika, data structures / struktur data) | Next open, not full, upcoming group with that subject (join location name) | "Try '{title}' ({subject}) at {place}, {time}, {members}/{max} joined. Open the Open Party tab and press Join!" / "Coba grup '{title}' ({subject}) di {place}, {time}, terisi {members}/{max}. Buka tab Open Party lalu klik Join!" If none: "No open {subject} group right now. You can create one in Open Party." / "Belum ada grup {subject} yang terbuka. Kamu bisa buat sendiri di Open Party." |
| 6 | study group | study group, study partner, study with, group / grup belajar, teman belajar, belajar bareng, grup | Next open, not full, upcoming group (any subject) | Same as rule 5 (with the group found) |
| 7 | events | event, workshop, seminar, upcoming / acara, kegiatan, event | Next published future event; prefer one from this community's organization, else any | "Next event: {title} by {org} on {date} at {place}. Open the Events tab to apply!" / "Event terdekat: {title} oleh {org}, {date} di {place}. Buka tab Events untuk daftar!" If none: "No upcoming events yet." / "Belum ada event mendatang." |
| 8 | places | place, where to study, location, library, cafe / tempat, lokasi, perpustakaan, kantin, dimana belajar, di mana belajar | Location with the highest `active_people` (Section 8.3) | "{place} is the busiest right now with {n} people studying. See it on the Map!" / "{place} lagi paling ramai, {n} orang sedang belajar. Cek di Map!" If all zero: "Nobody is studying yet. Be the first and create a group!" / "Belum ada yang belajar. Jadi yang pertama dan buat grup!" |
| 9 | points | point, points, score, rank, leaderboard / poin, skor, peringkat | User's `total_points` and rank from the `leaderboard` view | "You have {points} points and rank #{rank}. Join groups and answer questions to earn more (daily limits apply)." / "Poinmu {points} dan peringkatmu #{rank}. Ikut grup dan jawab pertanyaan untuk dapat poin (ada batas harian)." |
| 10 | badge | badge, expert / lencana, keahlian | Badge `min_answers` | "Answer {needed} questions in a subject group to request an expertise badge. A moderator approves it." / "Jawab {needed} pertanyaan di grup mata kuliah untuk mengajukan badge keahlian. Moderator yang menyetujui." |
| 11 | organization | organization, verify, verified / organisasi, verifikasi, daftar organisasi | none | "Organizations must be verified by an admin before they can publish events. You can register yours under Organizations." / "Organisasi harus diverifikasi admin dulu sebelum bisa publish event. Daftarkan organisasimu di menu Organizations." |
| 12 | collaboration | collab, collaborate / kolaborasi, kolab | none | "Verified organizations can open for collaboration and send requests to other organizations." / "Organisasi terverifikasi bisa membuka kolaborasi dan mengirim permintaan ke organisasi lain." |
| 13 | fallback | (anything else) | none | "I'm an auto-reply in this prototype, so I only know about events, study groups, places, points, badges, and organizations. Try asking about one of those!" / "Aku auto-reply di prototype ini, jadi hanya tahu soal event, grup belajar, tempat, poin, badge, dan organisasi. Coba tanya salah satunya ya!" |

### B.4 Implementation notes
- Implement as an ordered array of rule objects `{ id, en: [...], id: [...], handler(ctx, lang) }`, and a `getReply` loop that returns the first non-null handler result. Keep each handler small and readable.
- Date format in replies: `Sat, 21 Nov, 14:00` (English) or `Sab, 21 Nov, 14.00` (Indonesian), Asia/Jakarta time.
- Handlers must never throw: on a data error, return the fallback reply.
- Add a small unit test or a script `node src/services/chatbot.test.js` that checks at least one message per rule.

---

## Appendix C: Suggested first prompt to the AI assistant

> I am building the KOLABORIN hackathon prototype. Attached are the PRD (`KOLABORIN_PRD_v2.md`) and the logo file (`logo.png`). The PRD is the only specification. Read it fully, then do **Milestone M0 (Setup) only**: folder structure, all files, install commands, how to load `schema.sql`, and how to verify it works. Put the logo at `client/public/logo.png`. Do not start M1 until I confirm.