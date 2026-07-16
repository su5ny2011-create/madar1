/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
}

export default function Logo({
  className = '',
  size = 'md',
  showText = true,
  lightText = false,
}: LogoProps) {
  let svgWidth = 80;
  let svgHeight = 80;

  switch (size) {
    case 'sm':
      svgWidth = 40;
      svgHeight = 40;
      break;
    case 'md':
      svgWidth = 70;
      svgHeight = 70;
      break;
    case 'lg':
      svgWidth = 120;
      svgHeight = 120;
      break;
    case 'xl':
      svgWidth = 220;
      svgHeight = 220;
      break;
  }

  // Branding colors
  const primaryBlue = '#024B83';
  const accentOrange = '#E5941A';
  const successGreen = '#1C7C43';
  const lightBlue = '#1A98D3';

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Dynamic Digital Recreation of the Al-Madar Logo */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform hover:rotate-3 duration-300"
      >
        {/* Core Circuit Center (The Green Circle) */}
        <circle cx="200" cy="200" r="45" fill="white" stroke={successGreen} strokeWidth="6" />
        {/* Circuit tracks and nodes inside */}
        <path
          d="M200 230 V185 M200 185 L180 170 M200 195 L220 180"
          stroke={successGreen}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="200" cy="230" r="6" fill={successGreen} />
        <circle cx="180" cy="170" r="5" fill={lightBlue} />
        <circle cx="220" cy="180" r="5" fill={accentOrange} />

        {/* Orbit Ring 1 - Deep Blue (Tilt Bottom-Left to Top-Right) */}
        <ellipse
          cx="200"
          cy="200"
          rx="120"
          ry="55"
          transform="rotate(-40, 200, 200)"
          stroke={primaryBlue}
          strokeWidth="14"
          strokeDasharray="400 60"
          fill="none"
          strokeLinecap="round"
        />

        {/* Orbit Ring 2 - Golden Orange (Tilt Bottom-Right to Top-Left) */}
        <ellipse
          cx="200"
          cy="200"
          rx="135"
          ry="40"
          transform="rotate(25, 200, 200)"
          stroke={accentOrange}
          strokeWidth="11"
          strokeDasharray="450 40"
          fill="none"
          strokeLinecap="round"
        />

        {/* Orbit Ring 3 - Green (Sweeping Outer Loop) */}
        <ellipse
          cx="200"
          cy="200"
          rx="155"
          ry="65"
          transform="rotate(60, 200, 200)"
          stroke={successGreen}
          strokeWidth="12"
          fill="none"
          strokeDasharray="300 200"
          strokeLinecap="round"
        />

        {/* Orbital Binary Dots around rings */}
        <circle cx="110" cy="110" r="3" fill={lightBlue} />
        <circle cx="290" cy="290" r="3.5" fill={accentOrange} />
        <circle cx="80" cy="220" r="4" fill={successGreen} />
        <circle cx="320" cy="150" r="3" fill={primaryBlue} />

        {/* Arrows flying up right representing IT development & Growth */}
        {/* Arrow 1: Green */}
        <path
          d="M240 120 L300 60"
          stroke={successGreen}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M285 55 L305 55 L305 75" stroke={successGreen} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Arrow 2: Golden Orange (Higher and centered) */}
        <path
          d="M265 140 L340 65"
          stroke={accentOrange}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path d="M320 60 L345 60 L345 85" stroke={accentOrange} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Arrow 3: Light Blue (Below orange) */}
        <path
          d="M285 160 L350 95"
          stroke={lightBlue}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path d="M335 90 L355 90 L355 110" stroke={lightBlue} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Binary numbers text in circular path style */}
        <text x="70" y="160" fill={primaryBlue} fontSize="14" fontFamily="monospace" transform="rotate(-30 70 160)" opacity="0.8">101011</text>
        <text x="290" y="220" fill={lightBlue} fontSize="12" fontFamily="monospace" transform="rotate(15 290 220)" opacity="0.8">011101</text>
      </svg>

      {showText && (
        <div className="mt-4 text-center">
          {/* Custom styled logo text according to requirements */}
          <h1
            className={`text-2xl font-bold tracking-normal ${
              lightText ? 'text-white' : 'text-[#024B83]'
            } font-arabic`}
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            شركة المدار
          </h1>
          <p
            className={`text-sm font-semibold mt-0.5 tracking-wide ${
              lightText ? 'text-gray-200' : 'text-gray-600'
            } font-arabic`}
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            لتجارة تكنولوجيا المعلومات
          </p>

          <div
            className={`text-xs uppercase font-extrabold tracking-[0.15em] mt-2 ${
              lightText ? 'text-[#1A98D3]' : 'text-[#024B83]'
            } font-sans`}
          >
            AL-MADAR
          </div>
          <p
            className={`text-[9px] uppercase tracking-wider ${
              lightText ? 'text-gray-300' : 'text-gray-500'
            } font-sans font-semibold`}
          >
            FOR INFORMATION TECHNOLOGY TRADING
          </p>
        </div>
      )}
    </div>
  );
}
