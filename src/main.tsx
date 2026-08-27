import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { getDatabase } from "./db";
import "./index.css";
// Initialize PostHog as early as possible
import "./lib/posthog";

// Kick off RxDB initialization immediately at module load time.
// Since RxDB uses Dexie (IndexedDB), the local data is already persisted
// and will be available as soon as the database opens — no separate hydration step needed.
// This runs in parallel with React rendering so the DB is ready by the time
// components subscribe to collections.
getDatabase();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
