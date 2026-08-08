import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { hydrateQueryClientFromIDB } from "./cache/hydrateQueryClient.ts";
import { attachQueryCachePersistence } from "./cache/queryCachePersistence.ts";
import "./index.css";
import { queryClient } from "./queryClient.ts";

attachQueryCachePersistence(queryClient);

hydrateQueryClientFromIDB(queryClient).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
