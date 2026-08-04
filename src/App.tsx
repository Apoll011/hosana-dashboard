import { configureApiClient } from "@hosanna/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppRoutes } from "./routes/AppRoutes";
import { StatsigProvider, useClientAsyncInit } from "@statsig/react-bindings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

function StatsigWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const id = user?.id || "a-user";
  const { client } = useClientAsyncInit(
    "client-4459XEXCHZyP192QOlIwzRAffGVP9zfS33rnXpdquAI",
    { userID: id }
  );

  return (
    <StatsigProvider client={client} loadingComponent={<div>Loading...</div>}>
      {children}
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


