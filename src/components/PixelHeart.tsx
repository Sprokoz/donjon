import React from 'react';

interface PixelHeartProps {
  filled: boolean;
  color?: string;
  size?: number;
}

export const PixelHeart: React.FC<PixelHeartProps> = ({ filled, color = '#ef4444', size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 7 6"
      shapeRendering="crispEdges"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1V0z"
        fill={filled ? color : 'rgba(100, 116, 139, 0.25)'}
      />
      {filled && <rect x="1" y="1" width="1" height="1" fill="rgba(255, 255, 255, 0.55)" />}
    </svg>
  );
};

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
