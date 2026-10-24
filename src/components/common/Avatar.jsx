import React from 'react';

/**
 * Foto de perfil del usuario; si no cargó ninguna, muestra la inicial del nombre.
 */
export default function Avatar({ user, size = 'w-8 h-8', rounded = 'rounded-full', className = '', textClass = 'text-xs' }) {
  const name = user?.name || '';
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (user?.photo) {
    return (
      <img
        src={user.photo}
        alt={name}
        className={`${size} ${rounded} object-cover shrink-0 shadow-sm ${className}`}
      />
    );
  }

  return (
    <div className={`${size} ${rounded} bg-tennis-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm ${textClass} ${className}`}>
      {initial}
    </div>
  );
}
