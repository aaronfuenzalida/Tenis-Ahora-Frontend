import React from 'react';

/**
 * Tenis Ahora Official Logo Component
 * Recreates the official logo with racket, ball with dynamic motion curves, and typography.
 *
 * Props:
 * - variant: 'full' (icon + text), 'icon-only', 'horizontal' (icon + text side by side)
 * - theme: 'light' (green icon + dark text), 'dark' (white icon + white text), 'green-white' (white icon + white text on green)
 * - size: 'sm', 'md', 'lg', 'xl'
 * - className: custom classes
 */
export function TennisIcon({ size = 'md', className = '', color = 'currentColor' }) {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const dim = sizeMap[size] || size;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${dim} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Racket Handle Grip (bottom-left) */}
      <line
        x1="22"
        y1="78"
        x2="35"
        y2="65"
        stroke={color}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Handle butt cap line */}
      <line
        x1="19"
        y1="75"
        x2="25"
        y2="81"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Racket Throat connection */}
      <path
        d="M34 66 C 36 60, 40 56, 44 54"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M36 68 C 42 66, 46 64, 52 64"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Main Racket Circular Head */}
      <circle
        cx="56"
        cy="40"
        r="24"
        stroke={color}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Inside Tennis Ball Curve */}
      <path
        d="M44 43 C 44 32, 54 26, 64 26"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M48 54 C 58 54, 66 46, 68 36"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Dynamic Upper Motion Trail 1 */}
      <path
        d="M66 28 C 74 30, 80 34, 86 36"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Dynamic Lower Motion Trail 2 (longer swoop) */}
      <path
        d="M68 42 C 78 40, 84 46, 92 48"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  variant = 'horizontal', // 'horizontal', 'vertical', 'icon-only'
  theme = 'light', // 'light', 'dark', 'white'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  className = '',
  showSubtitle = false
}) {
  const isDark = theme === 'dark' || theme === 'white';
  const iconColor = isDark ? '#ffffff' : '#047857'; // emerald-700
  const primaryTextColor = isDark ? 'text-white' : 'text-slate-800';
  const secondaryTextColor = isDark ? 'text-tennis-200' : 'text-slate-700';

  if (variant === 'icon-only') {
    return <TennisIcon size={size} color={iconColor} className={className} />;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <TennisIcon size={size} color={iconColor} />
        <div className="mt-1 leading-none">
          <span className={`block font-black text-lg tracking-tight lowercase ${primaryTextColor}`}>
            tenis
          </span>
          <span className={`block font-bold text-lg tracking-tight lowercase ${secondaryTextColor}`}>
            ahora
          </span>
          {showSubtitle && (
            <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
              Club & Canchas
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <TennisIcon size={size} color={iconColor} className="shrink-0" />
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1">
          <span className={`font-black text-xl tracking-tight lowercase ${primaryTextColor}`}>
            tenis
          </span>
          <span className={`font-bold text-xl tracking-tight lowercase ${isDark ? 'text-tennis-300' : 'text-tennis-700'}`}>
            ahora
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold -mt-0.5">
            Club Deportivo
          </span>
        )}
      </div>
    </div>
  );
}
