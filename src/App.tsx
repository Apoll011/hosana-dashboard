import { configureApiClient } from "@hosanna/shared";
import { preloadEditor } from "@hosanna/shared/editor";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { NavigationProgressBar } from "./components/NavigationProgressBar";
import { AuthProvider } from "./contexts/AuthContext";
import { CacheHydrationProvider } from "./contexts/CacheHydrationProvider";
import { NavigationTransitionProvider } from "./contexts/NavigationTransitionContext";
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
    if (typeof window !== "undefined") {
      setTimeout(() => {
        void preloadEditor();
      }, 3000);
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SyncProvider>
            <CacheHydrationProvider>
              <BrowserRouter>
                <NavigationTransitionProvider>
                  <NavigationProgressBar />
                  <AppRoutes />
                </NavigationTransitionProvider>
              </BrowserRouter>
            </CacheHydrationProvider>
          </SyncProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
