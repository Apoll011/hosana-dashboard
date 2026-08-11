import { configureApiClient, Spinner } from "@hosanna/shared";
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
    { appVersion: APP_VERSION },
  );

  useEffect(() => {
    if (!client || isLoading) return;

    void client.updateUserAsync({
      appVersion: APP_VERSION,
      userID: user?.id ?? "anonymous",
      email: user?.email,
      locale: "pt",
      custom: {
        role: (user as any)?.role ?? "user",
        organization: organization?.slug ?? "default",
      },
    });
  }, [client, user, organization, isLoading]);

  return (
    <StatsigProvider
      client={client}
      loadingComponent={
        <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
          <Spinner size="lg" label="A autenticar no servidor de flags..." />
        </div>
      }
    >
      {isLoading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
          <Spinner size="lg" label="A autenticar o Utilizador..." />
        </div>
      ) : (
        children
      )}
    </StatsigProvider>
  );
}
export default function App() {
  configureApiClient(
    localStorage.getItem("server_url") ||
      import.meta.env.VITE_API_URL ||
      "/api",
  );
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
