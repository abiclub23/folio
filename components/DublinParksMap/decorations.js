export const PIN_R = 18

export const GrassTuft = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.7">
    <path d="M0,0 Q-3,-8 -2,-13" stroke="#7A9A6A" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <path d="M0,0 Q0,-4 1,-11" stroke="#8AAA78" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <path d="M0,0 Q3,-7 3,-12" stroke="#7A9A6A" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
  </g>
)

export const Bird = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.55">
    <path d="M-6,0 Q-3,-3 0,0 Q3,-3 6,0" stroke="#5A6B55" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
  </g>
)

export const Wildflowers = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.8">
    <circle cx="0"  cy="0"  r="2.2" fill="#F2C94C"/>
    <circle cx="6"  cy="-3" r="1.8" fill="#F26B5A"/>
    <circle cx="-5" cy="-4" r="2"   fill="#E8A0D0"/>
    <circle cx="3"  cy="4"  r="1.6" fill="#F2C94C"/>
    <circle cx="-3" cy="3"  r="1.8" fill="#9ED6A8"/>
    <circle cx="8"  cy="2"  r="1.5" fill="#E8A0D0"/>
  </g>
)

export const TreeIcon = ({ x, y, scale = 1, color = "#6B8E6F" }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-2.5" y="8" width="5" height="10" fill="#8B7355" rx="2"/>
    <circle cx="0" cy="3" r="9" fill={color} opacity="0.7"/>
    <circle cx="-4" cy="5" r="7" fill={color} opacity="0.6"/>
    <circle cx="4" cy="5" r="7" fill={color} opacity="0.6"/>
    <circle cx="0" cy="7" r="6" fill={color} opacity="0.8"/>
  </g>
)

export const Pond = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`} opacity="0.78">
    <ellipse cx="0" cy="0" rx="34" ry="16" fill="#7EC8E3" filter="url(#watercolor)"/>
    <ellipse cx="0" cy="0" rx="32" ry="14" fill="#A8DDF2" opacity="0.5"/>
    <ellipse cx="-5" cy="-3" rx="14" ry="6" fill="#C8EEF9" opacity="0.4"/>
    <ellipse cx="8" cy="4" rx="8" ry="3.5" fill="none" stroke="#B8E4F2" strokeWidth="0.8" opacity="0.55"/>
  </g>
)

export const House = ({ x, y, scale = 1, wallColor = "#E8D5B8", roofColor = "#C4845A" }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.87">
    <rect x="-12" y="0" width="24" height="17" rx="1.5" fill={wallColor} stroke="#B8A080" strokeWidth="0.7"/>
    <path d="M-14,0 L0,-14 L14,0 Z" fill={roofColor} stroke="#906040" strokeWidth="0.7"/>
    <rect x="-4" y="7" width="8" height="10" rx="1" fill="#8B6E50" opacity="0.72"/>
    <rect x="-11" y="3" width="7" height="5.5" rx="1" fill="#B8D8F0" opacity="0.8"/>
    <rect x="4" y="3" width="7" height="5.5" rx="1" fill="#B8D8F0" opacity="0.8"/>
  </g>
)

export const Car = ({ x, y, scale = 1, color = "#D4845A" }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-11" y="-4.5" width="22" height="9" rx="3" fill={color} opacity="0.87"/>
    <rect x="4" y="-3" width="5.5" height="6" rx="1.5" fill="#B8D8F0" opacity="0.65"/>
    <rect x="-9.5" y="-3" width="5" height="6" rx="1.5" fill="#B8D8F0" opacity="0.45"/>
    <rect x="-12" y="-6.5" width="5" height="3" rx="1" fill="#2A2A2A" opacity="0.75"/>
    <rect x="-12" y="3.5" width="5" height="3" rx="1" fill="#2A2A2A" opacity="0.75"/>
    <rect x="7" y="-6.5" width="5" height="3" rx="1" fill="#2A2A2A" opacity="0.75"/>
    <rect x="7" y="3.5" width="5" height="3" rx="1" fill="#2A2A2A" opacity="0.75"/>
  </g>
)

export const Bench = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-10" y="-5" width="20" height="3" rx="1.5" fill="#B09070" opacity="0.88"/>
    <rect x="-10" y="-1" width="20" height="3.5" rx="1.5" fill="#C4A882" opacity="0.92"/>
    <line x1="-7" y1="2.5" x2="-7" y2="7" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="2.5" x2="7" y2="7" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round"/>
  </g>
)

export const Bridge = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-9" y="-4.5" width="18" height="9" rx="0.5" fill="#D0B888" opacity="0.93"/>
    <rect x="-10" y="-6.5" width="20" height="2.2" rx="1" fill="#A88858" opacity="0.88"/>
    <rect x="-10" y="4.3" width="20" height="2.2" rx="1" fill="#A88858" opacity="0.88"/>
    <line x1="-7" y1="-4" x2="-7" y2="4" stroke="#B89868" strokeWidth="0.9" opacity="0.5"/>
    <line x1="-3" y1="-4" x2="-3" y2="4" stroke="#B89868" strokeWidth="0.9" opacity="0.5"/>
    <line x1="1" y1="-4" x2="1" y2="4" stroke="#B89868" strokeWidth="0.9" opacity="0.5"/>
    <line x1="5" y1="-4" x2="5" y2="4" stroke="#B89868" strokeWidth="0.9" opacity="0.5"/>
  </g>
)
