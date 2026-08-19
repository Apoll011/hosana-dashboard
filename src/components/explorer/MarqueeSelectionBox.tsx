import React from "react";
import { SelectionBox } from "../../hooks/useMarqueeSelection";

interface MarqueeSelectionBoxProps {
  box: SelectionBox | null;
}

export const MarqueeSelectionBox: React.FC<MarqueeSelectionBoxProps> = ({ box }) => {
  if (!box) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        pointerEvents: "none",
        zIndex: 100,
      }}
      className="border-2 border-sky-500 bg-sky-500/20 rounded-xl shadow-xl backdrop-blur-[1px] select-none"
    />
  );
};
