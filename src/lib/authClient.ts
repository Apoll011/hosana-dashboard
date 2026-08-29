/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAuthClient } from "better-auth/client";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}`
    : window.location.origin,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
    organizationClient({
      ac,
      roles,
      teams: {
        enabled: true,
      },
    }),
  ],
});

export type { Session, User } from "better-auth";
