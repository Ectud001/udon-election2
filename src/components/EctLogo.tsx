import React, { useState } from 'react';

interface EctLogoProps {
  className?: string;
  size?: number;
}

export const EctLogo: React.FC<EctLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  const [hasError, setHasError] = useState(false);

  // Official ECT Emblem Image URL
  const ectLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Seal_of_the_Office_of_the_Election_Commission_of_Thailand.svg/1024px-Seal_of_the_Office_of_the_Election_Commission_of_Thailand.svg.png';

  if (!hasError) {
    return (
      <img
        src={ectLogoUrl}
        alt="ตราสำนักงานคณะกรรมการการเลือกตั้ง (กกต.)"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        style={{ width: size, height: size }}
        className={`${className} object-contain shrink-0 drop-shadow-sm`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      <defs>
        <linearGradient id="ectGoldFallback" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF280" />
          <stop offset="50%" stopColor="#F5C400" />
          <stop offset="100%" stopColor="#B38000" />
        </linearGradient>
        <linearGradient id="ectBlueFallback" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00B4D8" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
      </defs>

      <path
        d="M 100 12 L 142 38 L 172 68 L 150 110 L 172 152 L 142 182 L 100 198 L 58 182 L 28 152 L 50 110 L 28 68 L 58 38 Z"
        fill="url(#ectGoldFallback)"
        stroke="#8B6914"
        strokeWidth="2"
      />
      <path
        d="M 100 24 L 134 44 L 160 70 L 142 108 L 160 144 L 134 170 L 100 184 L 66 170 L 40 144 L 58 108 L 40 70 L 66 44 Z"
        fill="url(#ectBlueFallback)"
        stroke="#FFE55C"
        strokeWidth="2"
      />
      <rect x="62" y="58" width="76" height="12" rx="2" fill="url(#ectGoldFallback)" stroke="#664D03" strokeWidth="1" />
      <path d="M 68 70 C 72 90, 128 90, 132 70 Z" fill="url(#ectGoldFallback)" stroke="#664D03" strokeWidth="1" />
      <path d="M 88 88 L 82 108 L 118 108 L 112 88 Z" fill="url(#ectGoldFallback)" stroke="#664D03" strokeWidth="1" />
      <path d="M 72 108 C 76 128, 124 128, 128 108 Z" fill="url(#ectGoldFallback)" stroke="#664D03" strokeWidth="1" />
    </svg>
  );
};


