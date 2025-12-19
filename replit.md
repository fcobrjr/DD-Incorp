# Common Area Planner

## Overview
A React + TypeScript application for planning and managing common areas, activities, teams, governance, and scheduling. Uses Express backend with Vite for development, Tailwind CSS for styling, Drizzle ORM for database, and Google Gemini API for AI features.

## Project Structure
```
client/           # Frontend React application
  src/
    components/   # Reusable React components
    context/      # React context (AppContext)
    data/         # Sample data and utilities
    hooks/        # Custom React hooks
    pages/        # Page components for routes
    services/     # API service integrations (Gemini)
    App.tsx       # Main application with routing
    main.tsx      # Entry point

server/           # Backend Express server
  index.ts        # Server entry point
  routes.ts       # API routes
  storage.ts      # Database storage layer
  vite.ts         # Vite dev middleware integration

shared/           # Shared between client and server
  types.ts        # TypeScript type definitions
  schema.ts       # Drizzle ORM database schema
```

## Development
- **Start**: `npm run dev` - Runs Express with Vite middleware on port 5000
- **Build**: `npm run build` - Creates production build
- **Preview**: `npm run preview` - Preview production build
- **DB Push**: `npm run db:push` - Push database schema changes

## Configuration
- Express serves API and Vite dev server on single port (5000)
- Vite configured for port 5000 with all hosts allowed for Replit proxy
- Uses `@` alias for client imports, `@shared` for shared imports
- Gemini API key accessed via `GEMINI_API_KEY` environment variable
- PostgreSQL database via Drizzle ORM (Neon-backed)

## Deployment
- Autoscale deployment with Express server
- Build command: `npm run build`
- Run command: `NODE_ENV=production node dist/index.js`

## Recent Changes
- 2025-12-19: Restructured to client/server/shared architecture
- 2025-12-19: Added Express backend with Vite integration
- 2025-12-19: Moved React context to centralized AppContext file
