# Card Forge

A web-based custom card creator for tabletop games. Design, preview, and export print-ready cards directly in your browser — no design software needed.

Currently supports **Zombicide 2nd Edition** (Guillotine Games).

---

## Features

- **Card editor** — Create and edit custom cards with a live preview. Supported types for Zombicide 2nd Edition:
  - Survivor (front + back)
  - Equipment
  - Pimp Weapon
  - Zombie Spawn
  - Abomination
- **PDF export** — Export your cards to A4 or Letter-size PDF, with or without card backs, ready to print and cut
- **Project management** — Organise cards into projects, control visibility (public/private), and update settings at any time
- **Public gallery** — Browse public projects from other users. View a project's cards in an interactive gallery before downloading
- **Like / save** — Save favourite public projects to your personal liked list, filterable by game and sortable by name, liked date, or last updated
- **User accounts** — Sign up with email/password. Update your display name, avatar, email address, and password from your profile page
- **Autosave** — Card changes are debounced and saved automatically to Firestore
- **Internationalisation** — UI available in English and Brazilian Portuguese (auto-detected from browser locale)

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite (SPA mode) |
| UI components | Radix UI Themes |
| Icons | Lucide React |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Backend / auth | Firebase (Firestore + Auth) |
| PDF generation | jsPDF + html2canvas |
| Canvas rendering | Konva / react-konva |
| Dates | Day.js |
| Toasts | Sonner |
| i18n | i18next + react-i18next |
| Linting | ESLint + eslint-plugin-perfectionist |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Firebase project with **Authentication** (Email/Password) and **Firestore** enabled

### Install

```bash
npm install
```

### Configure Firebase

Create a `.env.local` file in the project root with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Run

```bash
npm run dev        # development server
npm run build      # production build
npm run preview    # preview production build
npm run lint       # lint all files
```

---

## Firestore Data Model

```
projects/{projectId}
  userId        string   — owner UID
  gameId        string
  name          string
  description   string
  isPublic      boolean
  cards         array    — embedded ZombicideCardData[]
  createdAt     timestamp
  updatedAt     timestamp

users/{uid}/likes/{projectId}
  projectId     string
  name          string
  description   string
  gameId        string
  isPublic      boolean
  userId        string
  updatedAt     timestamp
  likedAt       timestamp  — server timestamp
```

### Recommended Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /projects/{projectId} {
      allow read: if resource.data.isPublic == true
                  || request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    match /users/{uid}/likes/{projectId} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

---

## Project Structure

```
src/
  components/
    cards/zombicide/       # Pure SVG card renderers (SurvivorCardFront, EquipmentCard, …)
    editors/               # Card editors, CardListView, ProjectOwnerView, ProjectViewerView
    editors/zombicide/     # Per-type editor forms (SurvivorCardEditor, …)
  contexts/
    FirebaseContext.tsx    # All Firestore operations + auth state
  hooks/                   # useProject, useProjects, useLikes, useToggleLike, …
  i18n/locales/            # en.json, pt-BR.json
  pages/                   # GameSelectionPage, GameProjectsPage, CardEditorPage,
                           #   LikedProjectsPage, ProfilePage
  types/
    game.ts                # Game / CardType definitions + SUPPORTED_GAMES registry
    zombicide-card.ts      # Card data types + dimensions
  utils/
    pdfGenerator.ts        # jsPDF multi-card layout
    imageUtils.ts          # resizeToDataUrl helper
```

---

## Migration Script

If you have existing data under the old `users/{uid}/projects` structure, run the one-time migration:

```bash
node scripts/migrate-to-flat-projects.mjs /path/to/serviceAccount.json
# Add --delete to remove the old nested data after verifying
node scripts/migrate-to-flat-projects.mjs /path/to/serviceAccount.json --delete
```

---

## Adding a New Game

1. Add a `Game` entry to `SUPPORTED_GAMES` in [src/types/game.ts](src/types/game.ts)
2. Create card data types in `src/types/`
3. Create card renderer components in `src/components/cards/<gameId>/`
4. Create editor form components in `src/components/editors/<gameId>/`
5. Register them in [src/components/editors/editorRegistry.ts](src/components/editors/editorRegistry.ts)
