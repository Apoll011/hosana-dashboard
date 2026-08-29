import { configureApiClient } from "@/src/api";
import { preloadEditor } from "@hosanna/chordpro/editor";
import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { posthog } from "./lib/posthog";
import { NavigationProgressBar } from "./components/NavigationProgressBar";
import { AuthProvider } from "./contexts/AuthContext";
import { CacheHydrationProvider } from "./contexts/CacheHydrationProvider";
import { NavigationTransitionProvider } from "./contexts/NavigationTransitionContext";
import { SyncProvider } from "./contexts/SyncContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./i18n";
import { AppRoutes } from "./routes/AppRoutes";

function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  configureApiClient(
    localStorage.getItem("server_url") ||
      import.meta.env.VITE_API_URL ||
      "/api",
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        void preloadEditor();
      }, 3000);
    }
  }, []);
  return (
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider>
          <SyncProvider>
            <CacheHydrationProvider>
              <BrowserRouter>
                <NavigationTransitionProvider>
                  <PageviewTracker />
                  <NavigationProgressBar />
                  <AppRoutes />
                </NavigationTransitionProvider>
              </BrowserRouter>
            </CacheHydrationProvider>
          </SyncProvider>
        </ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
