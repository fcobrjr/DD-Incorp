# Common Area Planner

## Overview
A React + TypeScript application built with Vite for planning and managing common areas. Uses Tailwind CSS for styling and the Google Gemini API for AI features.

## Project Structure
- `/components` - Reusable React components
- `/pages` - Page components for each route
- `/hooks` - Custom React hooks
- `/data` - Sample data and data utilities
- `/services` - API service integrations (Gemini)
- `App.tsx` - Main application component with routing
- `types.ts` - TypeScript type definitions

## Development
- **Start**: `npm run dev` - Runs Vite dev server on port 5000
- **Build**: `npm run build` - Creates production build in `dist/`
- **Preview**: `npm run preview` - Preview production build

## Configuration
- Vite configured for port 5000 with all hosts allowed for Replit proxy
- Uses `@` alias for root directory imports
- Gemini API key accessed via `GEMINI_API_KEY` environment variable

## Deployment
- Static deployment with `dist` as public directory
- Build command: `npm run build`
