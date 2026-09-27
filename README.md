# PATHFINDER AI

**FIT FEST HACKATHON 2026 · Personalized opportunity discovery**

> Students don't need another giant opportunity directory. They need personalized opportunity discovery.

PathFinder AI is a working, no-login student opportunity discovery platform. A student creates an opportunity profile, then receives a ranked board of internships, hackathons, scholarships, courses, certifications, competitions, workshops, and fellowships — with a plain-language explanation of why each result fits.

The MVP uses an intentionally labeled seeded demo dataset. It does **not** claim that the demo records are current opportunities. Users should verify eligibility, deadlines, and application details on the linked organization site before applying.

## Why it matters

Students miss opportunities because useful information is fragmented across job boards, social media, college groups, and newsletters. PathFinder turns the student's own context into a reusable discovery layer:

- **One profile** captures education, skills, interests, location, experience, and work preference.
- **One ranked board** surfaces the highest-signal opportunities first.
- **One explanation** makes every recommendation understandable instead of feeling like a black-box score.
- **One Copilot** turns natural-language questions into a focused local search.

## Features

- Premium startup-style landing page with FIT FEST story
- No-login demo mode with an Aarav Sharma sample profile
- Two-step onboarding and editable profile
- Dashboard with profile completion, match statistics, top matches, saved items, and deadline tracking
- 24 realistic, clearly labeled seeded demo opportunities across 8 categories
- Explore search, category, location, mode, education, and skill filters
- Deadline grouping: closing today, closing soon, this week, and upcoming
- Deterministic 0–100 personalized matching engine
- “Why this matches you” explanations on every opportunity detail view
- Save/unsave bookmarks persisted in `localStorage`
- Offline PathFinder Copilot fallback with intent parsing and ranked recommendations
- Responsive desktop, tablet, and Android mobile layouts
- Keyboard-accessible controls, semantic labels, focus states, empty states, toast feedback, and Escape-to-close details
- Production build and Cloud Run-ready Docker configuration

## Matching algorithm

Every score is deterministic and recomputed whenever the profile changes:

| Signal | Weight | How it is evaluated |
| --- | ---: | --- |
| Education | 25% | Current education level is compared with opportunity eligibility |
| Skills | 25% | Matched profile skills are divided by listed opportunity skills |
| Interests / category relevance | 20% | Profile interests and skills are compared with opportunity tags/category |
| Location / mode | 10% | Remote/hybrid/on-site preference or location is compared |
| Experience | 10% | Beginner, intermediate, advanced, and any-level fit |
| Preferred category | 10% | Opportunity category appears in the student's selected categories |

The score is implemented in `src/engine.ts`. It is never randomly generated.

## PathFinder Copilot

The Copilot is designed to work without an external AI key. It parses simple intent signals locally:

- Remote / online requests
- Deadline / closing-soon requests
- Category mentions
- Skill mentions
- Profile-aware ranking and explanation

For example, “Find remote AI opportunities for me” filters the current user's ranked dataset and returns the best matches. An optional production AI integration should be placed behind a server-side endpoint or Replit integration; API keys must never be put in frontend code. This MVP intentionally ships with the local fallback as the reliable default.

## Technology stack

- React 18
- TypeScript
- Vite
- CSS with responsive layout and design tokens
- lucide-react icons
- Browser `localStorage` for profile, onboarding state, and bookmarks

## Architecture

```text
src/
├── App.tsx       # App shell, views, onboarding, pages, modal, Copilot
├── data.ts       # Typed demo opportunity and profile data
├── engine.ts     # Deterministic matching score and explanations
├── main.tsx      # React entry point
└── styles.css    # Product UI, responsive layouts, motion, accessibility states
```

There is no database or external API dependency in the MVP. The data layer can later be replaced by a backend API without changing the matching interface.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL. The app also works through:

```bash
npm run build
npm run preview
```

The configured development and preview port is `8080`. Vite accepts the host `0.0.0.0` for Replit and container environments.

## Environment variables

No environment variables are required.

If an AI provider is added later, use a server-side secret such as `AI_API_KEY` or a Replit-managed integration. Never use a `VITE_` variable for a private key because Vite exposes `VITE_` values to the browser.

## Cloud Run deployment

The included `Dockerfile` builds the static Vite output and serves it through the Vite preview server on the Cloud Run-compatible `PORT` (defaults to `8080`).

```bash
docker build -t pathfinder-ai .
docker run -p 8080:8080 pathfinder-ai
```

For Cloud Run, deploy the container and allow the platform to provide `PORT`. The app listens on `0.0.0.0`.

## Demo instructions

1. Choose **Try demo** on the landing page.
2. Explore the dashboard and open a top match.
3. Open **Discover** and try the search, filters, and Deadline / Best match sorting.
4. Save an opportunity and refresh — the bookmark persists locally.
5. Open **Copilot** and ask “Find remote AI opportunities for me”.
6. Open **Profile**, change a skill, location, or category, save, and return to the dashboard. Scores and recommendations update deterministically.
7. Choose **Find my opportunities** from the landing page to use the onboarding flow with your own profile.

## Future scope

- Verified live opportunity ingestion with source freshness and deduplication
- Student accounts and cross-device profile sync
- Email / push deadline reminders
- University and community-admin submissions
- More granular skill taxonomy and explainable score weights
- Server-side AI Copilot with citations and an auditable retrieval layer
- Application tracking, notes, and outcome analytics