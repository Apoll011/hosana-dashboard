// useFlags.ts

import { useQuery } from "@tanstack/react-query";
import { flagsClient } from "@vercel/flags-core";

/**
 * Define all your flags here.
 *
 * The value is ONLY used for typing.
 */
export const flags = {
  "alpha-release": false,
} as const;

type FlagDefinitions = typeof flags;

export type FlagValues = {
  [K in keyof FlagDefinitions]: FlagDefinitions[K];
};

async function fetchFlags(): Promise<FlagValues> {
  const entries = await Promise.all(
    Object.keys(flags).map(async (key) => {
      const value = await flagsClient.evaluate(
        key,
        flags[key as keyof FlagDefinitions],
      );

      return [key, value];
    }),
  );

  return Object.fromEntries(entries) as FlagValues;
}

export function useFlags() {
  const query = useQuery({
    queryKey: ["flags"],
    queryFn: fetchFlags,

    // Flags almost never change while the app is open.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  return {
    ...query,

    flags: query.data,

    flag<K extends keyof FlagDefinitions>(
      name: K,
    ): FlagDefinitions[K] | undefined {
      return query.data?.[name];
    },
  };
}
