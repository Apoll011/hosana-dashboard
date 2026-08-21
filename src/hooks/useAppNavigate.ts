// lib/navigation/useAppNavigate.ts
import { useCallback, useTransition } from "react";
import { useNavigate, type NavigateOptions, type To } from "react-router-dom";

export function useAppNavigate() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const go = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      startTransition(() => {
        if (typeof to === "number") {
          navigate(to);
        } else {
          navigate(to, options);
        }
      });
    },
    [navigate],
  );

  return { navigate: go, isPending };
}
