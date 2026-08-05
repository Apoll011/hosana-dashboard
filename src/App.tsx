import { configureApiClient, Spinner } from "@hosanna/shared";
import { StatsigProvider, useClientAsyncInit } from "@statsig/react-bindings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppRoutes } from "./routes/AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

function StatsigWrapper({ children }: { children: React.ReactNode }) {
  const { user, tenant, isLoading } = useAuth();

  const { client } = useClientAsyncInit(
    "client-4459XEXCHZyP192QOlIwzRAffGVP9zfS33rnXpdquAI",
    {},
  );

  useEffect(() => {
    if (!client || isLoading) return;

    void client.updateUserAsync({
      userID: user?.id ?? "anonymous",
      email: user?.email,
      locale: "pt",
      custom: {
        role: user?.role ?? "user",
        tenant_slug: tenant?.slug ?? "default",
      },
    });
  }, [client, user, tenant, isLoading]);

  return (
    <StatsigProvider
      client={client}
      loadingComponent={
        <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
          <Spinner size="lg" label="A autenticar no servidor de flags..." />
        </div>
      }
    >
      {isLoading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
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
              <BrowserRouter>
                <Analytics />
                <SpeedInsights />
                <AppRoutes />
              </BrowserRouter>
            </SyncProvider>
          </ThemeProvider>
        </StatsigWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}
