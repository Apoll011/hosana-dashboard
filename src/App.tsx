import { configureApiClient, Spinner } from "@hosanna/shared";
import { preloadEditor } from "@hosanna/shared/editor";
import { StatsigProvider, useClientAsyncInit } from "@statsig/react-bindings";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CacheHydrationProvider } from "./contexts/CacheHydrationProvider";
import { SyncProvider } from "./contexts/SyncContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { queryClient } from "./queryClient";
import { AppRoutes } from "./routes/AppRoutes";

function StatsigWrapper({ children }: { children: React.ReactNode }) {
  const { user, organization, isLoading } = useAuth();

  const { client } = useClientAsyncInit(
    "client-4459XEXCHZyP192QOlIwzRAffGVP9zfS33rnXpdquAI",
    {
      appVersion: APP_VERSION,
      options: {
        initTimeoutMs: 2000, // Do not block offline start
      },
    },
  );

  useEffect(() => {
    if (!client || isLoading) return;

    client
      .updateUserAsync({
        appVersion: APP_VERSION,
        userID: user?.id ?? "anonymous",
        email: user?.email,
        locale: "pt",
        custom: {
          role: (user as { role?: string })?.role ?? "user",
          organization: organization?.slug ?? "default",
        },
      })
      .catch((err) => {
        console.warn("Failed to update statsig user (probably offline):", err);
      });
  }, [client, user, organization, isLoading]);

  // When offline or if client is still initializing, don't block the UI if user is already loaded
  const content = isLoading ? (
    <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
      <Spinner size="lg" label="A autenticar o Utilizador..." />
    </div>
  ) : (
    children
  );

  if (!client) {
    return <>{content}</>;
  }

  return (
    <StatsigProvider
      client={client}
      loadingComponent={
        <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
          <Spinner size="lg" label="A autenticar no servidor de flags..." />
        </div>
      }
    >
      {content}
    </StatsigProvider>
  );
}
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
        <StatsigWrapper>
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
        </StatsigWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}
