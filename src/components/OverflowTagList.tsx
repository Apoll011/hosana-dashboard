import { Badge } from "@hosanna/shared";
import React, { useEffect, useRef, useState } from "react";

interface OverflowTagListProps {
  tags?: string[] | null;
}

export const OverflowTagList: React.FC<OverflowTagListProps> = ({ tags }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const safeTags = tags ?? [];

  const [visibleCount, setVisibleCount] = useState<number>(safeTags.length);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(true);

  useEffect(() => {
    const calculateOverflow = () => {
      setIsMeasuring(true);

      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const children = Array.from(
          containerRef.current.children,
        ) as HTMLElement[];
        if (children.length === 0) return;

        const firstItemTop = children[0].offsetTop;
        let cutOffIndex = safeTags.length;

        for (let i = 0; i < children.length; i++) {
          if (children[i].offsetTop > firstItemTop) {
            cutOffIndex = i > 0 ? i - 1 : 0;
            break;
          }
        }

        setVisibleCount(cutOffIndex);
        setIsMeasuring(false);
      });
    };

    calculateOverflow();

    window.addEventListener("resize", calculateOverflow);
    return () => window.removeEventListener("resize", calculateOverflow);
  }, [safeTags]);

  if (safeTags.length === 0) {
    return <span className="text-xs text-m3-secondary opacity-30">—</span>;
  }

  const tagsToShow = isMeasuring ? safeTags : safeTags.slice(0, visibleCount);
  const hiddenCount = safeTags.length - visibleCount;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-1.5 overflow-hidden h-6"
    >
      {tagsToShow.map((tag) => (
        <Badge key={tag} variant="slate">
          {tag}
        </Badge>
      ))}

      {!isMeasuring && hiddenCount > 0 && (
        <Badge variant="slate">+{hiddenCount}</Badge>
      )}
    </div>
  );
};
