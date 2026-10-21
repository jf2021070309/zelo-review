"use client";

import { useState } from "react";

const LABELS = ["", "Terrible", "Malo", "Regular", "Bueno", "Excelente"];

export default function StarRating({
  value,
  onChange,
  size = 44,
  showLabel = true,
  color = "#FBBC04",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  showLabel?: boolean;
  color?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}: ${LABELS[n]}`}
            disabled={!onChange}
            onMouseEnter={() => onChange && setHover(n)}
            onClick={() => onChange?.(n)}
            className={`transition-transform ${onChange ? "hover:scale-110 active:scale-95 cursor-pointer" : "cursor-default"}`}
            style={{ width: size, height: size }}
          >
            <svg viewBox="0 0 24 24" width={size} height={size}>
              <path
                d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
                fill={n <= shown ? color : "none"}
                stroke={n <= shown ? color : "#9AA0A6"}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
      {showLabel && <div className="h-5 text-sm font-medium text-[#5f6368]">{LABELS[shown] || ""}</div>}
    </div>
  );
}

export function StarsInline({ value, size = 14, emptyColor = "#DADCE0" }: { value: number; size?: number; emptyColor?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" width={size} height={size}>
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
            fill={n <= value ? "#FBBC04" : emptyColor}
          />
        </svg>
      ))}
    </span>
  );
}
