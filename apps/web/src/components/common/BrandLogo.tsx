import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BackupOps Logo"
    >
      {/* Precision Geometric Perimeter */}
      <path
        d="M16 2.5L28 8.5V17.5C28 24.5 22.5 29.5 16 31C9.5 29.5 4 24.5 4 17.5V8.5L16 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Three Horizontal Data Strata (Base Snapshot, Incremental, WAL) */}
      <path
        d="M10 12H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 16.5H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M10 21H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );
};
