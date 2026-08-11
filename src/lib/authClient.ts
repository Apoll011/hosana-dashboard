/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAuthClient } from "better-auth/client";
import { twoFactorClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}`
    : window.location.origin,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    twoFactorClient(),
    organizationClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
