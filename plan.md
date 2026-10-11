# Biglang Gwapo Barber Shop — Implementation Plan

## Product approach

Build a frontend-only React + Vite demonstration that feels like a real barbershop operations product while keeping all data local and replaceable. React Router provides the complete 35-page route surface. A shared AppStore keeps role, modal state, mock entities, and workflow transitions in one place; `src/mockService.js` exposes API-shaped functions so an Express/MERN service can replace it later without rewriting the UI.

The demo workflow is intentionally connected: a customer can choose a service, barber, date, and slot; reception can confirm and mark arrival; the arrival creates one queue entry; the barber starts/completes the session with notes; reception records one mock payment and receipt; the completed service appears in customer history, reviews, and analytics.

## Design direction

- **Design movement:** modern classic barbershop minimalism — editorial typography, generous off-white canvas, charcoal anchors, and restrained brass details.
- **Core principles:** fast scanning, calm confidence, task-first hierarchy, and warm human service.
- **Color philosophy:** near-black and charcoal signal craft and precision; off-white keeps the experience welcoming; muted gold marks moments worth noticing rather than becoming decoration.
- **Layout paradigm:** asymmetric bento summaries for dashboards, paired with dense but breathable tables and split detail panels for operations.
- **Signature elements:** brass section markers, initials-based avatar circles, and compact status chips with text labels.
- **Interaction philosophy:** every action gives a clear next state, preserving the demo’s operational story rather than simulating isolated screens.
- **Animation:** subtle 160–220ms fades and lift on hover only; no looping or decorative motion.
- **Typography:** Inter/system sans for all UI; bold condensed-feeling headings created with weight and letter spacing rather than a display font dependency.
- **Brand essence:** a neighborhood grooming ritual with the clarity of a well-run studio — direct, warm, assured.
- **Brand voice:** headlines sound confident and local; CTAs are specific. Examples: “Sharp cuts. Easy booking.” and “Keep the chair moving.”
- **Wordmark / logo:** an easy-to-replace typographic lockup with a small brass “BG” stamp; supplied logo was not present in the upload, so no supplied asset is altered or redrawn.
- **Signature brand color:** muted brass `#B88A44`.

## Technical structure

- `src/main.jsx`: Vite entry and router mounting.
- `src/App.jsx`: route map, store provider, shared layout, auth/staff modals, and page components.
- `src/data.js`: believable Philippine demo entities and static navigation metadata.
- `src/mockService.js`: localStorage-backed, API-shaped CRUD/workflow functions; passwords are never persisted.
- `src/styles.css`: responsive visual system and accessibility states.
- `public/manus-routes.json`: complete page route manifest for preview tooling.
- `README.md`: setup, demo access, workflow walkthrough, and 35-page coverage checklist.

## Delivery workflow

Run `npm install`, start Vite on the managed port 3000, verify `/manus-routes.json`, exercise the production build, then package the source without `node_modules`. The project stays frontend-only and is not published publicly unless separately requested.
