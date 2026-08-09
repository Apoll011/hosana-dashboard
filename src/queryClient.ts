/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared QueryClient singleton.
 *
 * Extracted into its own module so that:
 *   - main.tsx can attach IDB persistence and run hydration before the first
 *     render, using the exact same QueryClient instance.
 *   - App.tsx imports and passes the same instance to QueryClientProvider.
 *
 * This avoids duplicating the QueryClient constructor options.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});
