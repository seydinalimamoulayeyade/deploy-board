/**
 * Logo de marque Deploy Board — fusée de déploiement avec dégradé.
 * @param {number} size - taille en pixels
 * @param {boolean} withText - affiche le nom à côté du symbole
 */
const Logo = ({ size = 32, withText = true }) => {
  const gid = 'db-logo-grad'
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="#0d1117" />
        <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke={`url(#${gid})`} strokeOpacity="0.5" strokeWidth="3" />
        <path
          d="M32 12c6.5 3.2 10 9 10 16 0 3.2-.8 6-2 8.2l-3.4-2.2a2 2 0 0 0-2.2 0l-4.4 2.9-4.4-2.9a2 2 0 0 0-2.2 0L20 36.2c-1.2-2.2-2-5-2-8.2 0-7 3.5-12.8 10-16z"
          fill={`url(#${gid})`}
        />
        <circle cx="32" cy="26" r="4" fill="#0d1117" />
        <path d="M28 42l4 8 4-8-1.8 1.2a2 2 0 0 1-2.2 0z" fill="#06b6d4" />
      </svg>
      {withText && (
        <span className="font-semibold text-gh-fg tracking-tight">
          Deploy<span className="text-brand-cyan">Board</span>
        </span>
      )}
    </span>
  )
}

export default Logo
