# Crowd Management System

A web dashboard for monitoring crowd occupancy, reviewing visitor activity, and understanding crowd patterns across different sites.

The project was built as part of a Kloudspot coding assignment. It connects to the provided APIs to display historical analytics and uses Socket.IO for real-time updates.

**Live Demo:** https://crowd-management-phi.vercel.app

**GitHub Repository:** https://github.com/Abijith26/Crowd-Management

## Features

### Dashboard
- View live occupancy for the selected site.
- Review average occupancy, daily footfall, and average dwell time.
- Explore historical occupancy trends over a selected time range.
- View historical gender distribution.
- Monitor live male and female counts separately from historical data.
- View real-time alerts with details such as zone, event direction, severity, and timestamp.

### Crowd Entries
- Review visitor session records.
- View entry and exit times.
- Identify sessions that are still in progress when no exit time is available.
- Filter records using the available site and time-range controls.

### Authentication
- Sign in using the credentials provided for the assignment.
- Send authenticated API requests using a bearer token.
- Clear an invalid or expired session and return the user to the login page.

### General
- Responsive layout for different screen sizes.
- Loading, error, and empty states for data-driven sections.
- Direct navigation to application routes after deployment.

## Tech Stack

- **React** for building the user interface
- **TypeScript** for type-safe application code
- **Vite** for development and production builds
- **Tailwind CSS** for styling
- **Recharts** for analytics charts
- **React Router** for client-side navigation
- **Socket.IO Client** for real-time updates
- **REST APIs** for authentication, site information, analytics, and visitor data
- **Vercel** for deployment

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Abijith26/Crowd-Management.git
cd Crowd-Management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and configure the API and Socket.IO URLs:

```env
VITE_API_BASE_URL=https://hiring-dev.internal.kloudspot.com
VITE_SOCKET_URL=https://hiring-dev.internal.kloudspot.com
```

Use the API and socket URLs specified in the assignment documentation if they differ from these values.

Do not commit credentials, access tokens, or other secrets to the repository. Variables prefixed with `VITE_` are included in the client-side application bundle, so they should only contain values intended to be public.

### 4. Start the development server

```bash
npm run dev
```

Vite will display the local URL in the terminal, usually:

```text
http://localhost:5173
```

### 5. Create a production build

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Application Structure

```text
Crowd-Management/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── lib/
│   ├── page-components/
│   │   └── dashboard/
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── EntriesPlaceholder.tsx
│   │   └── LoginPage.tsx
│   ├── services/
│   │   ├── analyticsService.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── socket.ts
│   │   └── token.ts
│   ├── types/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

## How the Data Is Used

The dashboard uses REST APIs to retrieve site information and historical analytics. Socket.IO supplies live occupancy updates and real-time alerts.

Historical chart data and live measurements are handled separately so that real-time updates do not get confused with historical records.

The application relies on the APIs and data supplied by the Kloudspot environment. It does not implement its own crowd-detection or prediction engine.

## Deployment

The frontend is deployed on Vercel.

For a Vite application, use the following build settings:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` or `npm ci` |

Configure the required environment variables in the Vercel project settings before deploying.

The `vercel.json` configuration supports client-side routing so routes such as `/login`, `/dashboard`, and `/entries` can be opened directly.

## Author

**Abijith M**

GitHub: https://github.com/Abijith26
