// Orbit — SVG logo mark
// An orbital ring with a planet/dot, evoking the "Orbit" brand name.

export default function OrbitLogo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer orbital ring — tilted ellipse */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5.5"
        transform="rotate(-30 16 16)"
        stroke="url(#ring-gradient)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Second orbital ring at a different angle */}
      <ellipse
        cx="16"
        cy="16"
        rx="9"
        ry="3.8"
        transform="rotate(50 16 16)"
        stroke="url(#ring2-gradient)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Central planet */}
      <circle cx="16" cy="16" r="4.5" fill="url(#planet-gradient)" />
      {/* Highlight on planet */}
      <circle cx="14.5" cy="14.5" r="1.4" fill="white" opacity="0.25" />
      {/* Orbiting dot */}
      <circle cx="27" cy="12.5" r="2" fill="url(#dot-gradient)" />

      <defs>
        <linearGradient id="ring-gradient" x1="3" y1="16" x2="29" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="ring2-gradient" x1="7" y1="16" x2="25" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id="planet-gradient" cx="40%" cy="35%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <radialGradient id="dot-gradient" cx="40%" cy="35%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </radialGradient>
      </defs>
    </svg>
  )
}
