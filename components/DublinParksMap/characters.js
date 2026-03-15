export const Cyclist = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="-15" cy="5" r="9" fill="none" stroke="#5A4A3A" strokeWidth="1.8"/>
    <circle cx="15" cy="5" r="9" fill="none" stroke="#5A4A3A" strokeWidth="1.8"/>
    <line x1="-15" y1="-3" x2="-15" y2="13" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <line x1="-23" y1="5" x2="-7" y2="5" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <line x1="7" y1="5" x2="23" y2="5" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <line x1="15" y1="-3" x2="15" y2="13" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <path d="M-15,5 L2,-4 L15,5" stroke="#D4845A" strokeWidth="2" fill="none"/>
    <line x1="2" y1="-4" x2="-2" y2="-15" stroke="#D4845A" strokeWidth="2"/>
    <line x1="15" y1="5" x2="9" y2="-4" stroke="#D4845A" strokeWidth="2"/>
    <line x1="-5" y1="-4" x2="9" y2="-4" stroke="#D4845A" strokeWidth="1.5"/>
    <path d="M9,-4 L13,-7 L15,-5" stroke="#5A4A3A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <circle cx="-2" cy="-24" r="6" fill="#F5C5A3"/>
    <path d="M-6,-24 Q-11,-19 -9,-15" stroke="#4A3020" strokeWidth="1.5" fill="none"/>
    <path d="M2,-24 Q7,-19 5,-15" stroke="#4A3020" strokeWidth="1.5" fill="none"/>
    <path d="M-2,-18 C-2,-12 9,-6 9,-4" stroke="#5B7EC4" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M-2,-18 L-15,5" stroke="#4A6E9A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </g>
)

export const KidSplashing = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-18" r="6" fill="#F5C5A3"/>
    <line x1="0" y1="-12" x2="0" y2="2" stroke="#5B9ED6" strokeWidth="3" strokeLinecap="round"/>
    <path d="M0,-8 L-12,-17" stroke="#5B9ED6" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,-8 L12,-17" stroke="#5B9ED6" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="-13" cy="-19" r="1.5" fill="#5BB5F0" opacity="0.85"/>
    <circle cx="13" cy="-19" r="1.5" fill="#5BB5F0" opacity="0.85"/>
    <circle cx="-17" cy="-16" r="1" fill="#5BB5F0" opacity="0.6"/>
    <circle cx="17" cy="-16" r="1" fill="#5BB5F0" opacity="0.6"/>
    <path d="M0,2 L-10,14" stroke="#4A6E9A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,2 L10,14" stroke="#4A6E9A" strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="0" cy="17" rx="14" ry="3" fill="#5BB5F0" opacity="0.2"/>
  </g>
)

export const KidRunning = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-18" r="5.5" fill="#F5C5A3"/>
    <path d="M0,-12 L0,2" stroke="#E8845A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,-8 L-11,-2" stroke="#E8845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-8 L9,-14" stroke="#E8845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,2 L-9,14" stroke="#7A6B5A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,2 L10,7" stroke="#7A6B5A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,7 L14,15" stroke="#7A6B5A" strokeWidth="2" strokeLinecap="round"/>
  </g>
)

export const DogWalker = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-20" r="5.5" fill="#F5C5A3"/>
    <path d="M0,-14 L0,0" stroke="#C4845A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,-10 L10,-5" stroke="#C4845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,0 L-5,12" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,0 L5,12" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,-5 Q18,2 22,5" stroke="#8B7355" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <ellipse cx="26" cy="6" rx="8" ry="4.5" fill="#C4A882"/>
    <circle cx="33" cy="3.5" r="4" fill="#C4A882"/>
    <ellipse cx="35" cy="0.5" rx="2" ry="3" fill="#B09070" transform="rotate(15,35,0.5)"/>
    <line x1="20" y1="10" x2="19" y2="16" stroke="#8B6F52" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="24" y1="10" x2="23" y2="16" stroke="#8B6F52" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="28" y1="10" x2="29" y2="16" stroke="#8B6F52" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="32" y1="10" x2="33" y2="16" stroke="#8B6F52" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M18,5 Q14,1 15,-3" stroke="#C4A882" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </g>
)

export const PicnicScene = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="8" rx="22" ry="9" fill="#E8A87C" opacity="0.85"/>
    <line x1="-7" y1="2" x2="-5" y2="17" stroke="#D4755A" strokeWidth="1.5" opacity="0.45"/>
    <line x1="3" y1="1" x2="5" y2="17" stroke="#D4755A" strokeWidth="1.5" opacity="0.45"/>
    <circle cx="-10" cy="-8" r="5.5" fill="#F5C5A3"/>
    <path d="M-10,-2 L-10,8" stroke="#5B7EC4" strokeWidth="3" strokeLinecap="round"/>
    <path d="M-10,2 L-18,3" stroke="#5B7EC4" strokeWidth="2" strokeLinecap="round"/>
    <path d="M-10,8 L-15,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M-10,8 L-5,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="-8" r="5.5" fill="#F5C5A3"/>
    <path d="M10,-2 L10,6" stroke="#E8845A" strokeWidth="3" strokeLinecap="round"/>
    <path d="M10,2 L18,0" stroke="#E8845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,6 L5,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,6 L15,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <rect x="-2" y="4" width="7" height="6" rx="2" fill="#C4A882"/>
    <path d="M-2,4 Q1.5,1 5,4" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
    <circle cx="15" cy="11" r="2" fill="#F2C94C" opacity="0.9"/>
    <circle cx="19" cy="9" r="1.5" fill="#F26B5A" opacity="0.9"/>
  </g>
)

export const ParentStroller = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-22" r="6" fill="#F5C5A3"/>
    <path d="M0,-16 L0,-2" stroke="#8B6E9E" strokeWidth="3" strokeLinecap="round"/>
    <path d="M0,-10 L-8,-5" stroke="#8B6E9E" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-10 L8,-2" stroke="#8B6E9E" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-2 L-6,10" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-2 L6,10" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8,-2 L18,4" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18,4 L22,12 L10,12 Z" fill="#D4A0C0" opacity="0.9"/>
    <circle cx="22" cy="14" r="3" fill="none" stroke="#5A4A3A" strokeWidth="1.5"/>
    <circle cx="10" cy="14" r="3" fill="none" stroke="#5A4A3A" strokeWidth="1.5"/>
    <circle cx="16" cy="9" r="3.5" fill="#F5C5A3"/>
  </g>
)
