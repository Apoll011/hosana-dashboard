// contexts/NavigationTransitionContext.tsx
import React, { createContext, useContext } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";

const Ctx = createContext<ReturnType<typeof useAppNavigate> | null>(null);

export const NavigationTransitionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useAppNavigate();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useNavTransition = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useNavTransition must be used within NavigationTransitionProvider",
    );
  return ctx;
};
