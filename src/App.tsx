import { configureApiClient } from "@hosanna/shared";
import { preloadEditor } from "@hosanna/shared/editor";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CacheHydrationProvider } from "./contexts/CacheHydrationProvider";
import { SyncProvider } from "./contexts/SyncContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { queryClient } from "./queryClient";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  configureApiClient(
    localStorage.getItem("server_url") ||
      import.meta.env.VITE_API_URL ||
      "/api",
  );

  useEffect(() => {
    // Preload Ace editor during idle time so first song click opens editor instantly
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          void preloadEditor();
        });
      } else {
        setTimeout(() => {
          void preloadEditor();
        }, 1500);
      }
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SyncProvider>
            <CacheHydrationProvider>
              <BrowserRouter>
                <Analytics />
                <SpeedInsights />
                <AppRoutes />
              </BrowserRouter>
            </CacheHydrationProvider>
          </SyncProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
