# Turni Offline App

Offline-first Expo/React Native app for managing weekly employee shifts. No backend, no login, no external APIs — everything is stored locally on the device.

## Features

- **Employee management** — add, edit, delete employees with color-coded assignments
- **Location management** — add, edit, delete work locations
- **Weekly shift scheduling** — assign employees to shifts with date, time, and break
- **Week navigation** — swipe between previous/next weeks
- **Copy from previous week** — duplicate last week's schedule
- **Conflict detection** — prevents double-booking an employee on the same day
- **Weekly hours calculation** — auto-calculates total hours per employee per week
- **PDF export & share** — generate a weekly PDF report and share it via `expo-sharing`
- **Color picker** — assign a unique color to each employee for visual identification
- **Multi-language** — Italian and English built-in, easily extensible
- **Offline persistence** — all data saved to `AsyncStorage`
- **Dark mode ready** — styled with a minimal, readable palette

## Tech Stack

| Tech | Purpose |
|---|---|
| **Expo SDK 53** | Framework |
| **React 19** | UI library |
| **React Native 0.79** | Native runtime |
| **TypeScript** (strict) | Language |
| **AsyncStorage** | Local persistence |
| **expo-print** | PDF generation |
| **expo-sharing** | PDF sharing |
| **react-native-wheel-color-picker** | Color selection |

## Getting Started

```bash
npm install
npm start
```

Open with Expo Go, or run on a simulator:

```bash
npm run ios
npm run android
```

## Project Structure

```
App.tsx                 — root component, state management, routing
src/
  components/           — reusable UI primitives (Card, Button, ShiftItem, etc.)
  data/seed.ts          — initial seed data
  locales/              — i18n (Italian, English)
  screens/              — DipendentiScreen, SediScreen, TurniScreen, etc.
  storage/storage.ts    — AsyncStorage load/save
  styles.ts             — shared StyleSheet definitions
  types.ts              — TypeScript interfaces
  utils/
    date.ts             — date formatting, week calculations, conflict check
    pdf.ts              — PDF HTML template generation
```

## Notes

This is an MVP built for offline, single-device use. All data is persisted locally — there is no sync, no cloud, and no multi-device support.
