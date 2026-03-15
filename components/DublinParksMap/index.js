import { useState } from 'react'

function getTooltipStyle(park) {
  const leftPct = (park.x / 800) * 100
  const topPct  = (park.y / 520) * 100
  const flipX   = park.x > 400       // pin in right half → open card leftward
  const flipY   = park.y > 346       // pin in bottom third → open card upward
  const PIN_GAP = 28                  // px offset from pin center (accounts for PIN_R=18 + label)

  return {
    position: 'absolute',
    left: `${leftPct}%`,
    top: `${topPct}%`,
    transform: [
      flipX ? 'translateX(-100%)' : 'translateX(0)',
      flipY
        ? `translateY(calc(-100% - ${PIN_GAP}px))`
        : `translateY(${PIN_GAP}px)`,
    ].join(' '),
    width: '210px',
    pointerEvents: 'none',
    zIndex: 20,
  }
}

const PARKS = [
  {
    id: 1,
    kidName: "Splash Park",
    officialName: "Emerald Glen Park",
    note: "The one with the water jets. A summer essential , but also great year round. It also hosts farmer's market in the fall and has wave water park in the summer.",
    x: 482, y: 280,
    color: "#5BB5F0",
    bgColor: "#A8D5E2",
    icon: "💧"
  },
  {
    id: 2,
    kidName: "Red Park",
    officialName: "Bray Commons",
    note: "Named for the red climbing structure you can see from the parking lot. Probably our most used park, lot of great memories here.",
    x: 676, y: 328,
    color: "#F26B5A",
    bgColor: "#FFB4C8",
    icon: "🛝"
  },
  {
    id: 3,
    kidName: "Library Park",
    officialName: "Imagine Playground",
    note: "Right next to the library. We stop here every time — return the books, then spend an hour on the swings.",
    x: 300, y: 352,
    color: "#FF8C00",
    bgColor: "#FFE4B5",
    icon: "📚"
  },
  {
    id: 4,
    kidName: "School Park",
    officialName: "Passatempo Park",
    note: "Cross it to and fro from school. It has a nice playground , filled with classmates.",
    x: 588, y: 248,
    color: "#27AE60",
    bgColor: "#C8E6C9",
    icon: "🌿"
  },
  {
    id: 5,
    kidName: "Pink Park",
    officialName: "Don Biddle Community Park",
    note: "Biggest park on the list. The pink play equipment is impossible to miss. Zipline is a big hit with the kids.",
    x: 378, y: 336,
    color: "#E91E8C",
    bgColor: "#F8BBD0",
    icon: "🌸"
  },
  {
    id: 6,
    kidName: "Wood Park",
    officialName: "Forest Park",
    note: "Deep in Jordan Ranch. Log bridges, rope climbs. Rolling hills views",
    x: 672, y: 165,
    color: "#2E7D32",
    bgColor: "#A5D6A7",
    icon: "🌲"
  },
  {
    id: 7,
    kidName: "Mountain Park",
    officialName: "Sunset Park",
    note: "Bit of a hike to get here, hence the name 'Mountain Park'. But the evening light here is something else. Great views of the city and the hills.",
    x: 755, y: 318,
    color: "#E67E22",
    bgColor: "#FAD7A0",
    icon: "🌅"
  },
  {
    id: 8,
    kidName: "Really Far Park",
    officialName: "Schaefer Ranch Park",
    note: "Way out in Schaefer Ranch. Feels like the edge of Dublin. Worth the drive when the weather is good.",
    x: 55, y: 395,
    color: "#D4845A",
    bgColor: "#F5CBA7",
    icon: "🚗"
  },
  {
    id: 9,
    kidName: "Parachutes Park",
    officialName: "Wallis Ranch Community Park",
    note: "The parachute climbing dome is the main event, the kids discovered it by accident.",
    x: 565, y: 155,
    color: "#2980B9",
    bgColor: "#AED6F1",
    icon: "🪂"
  }
]

// Grass tuft — three short blades
const GrassTuft = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.7">
    <path d="M0,0 Q-3,-8 -2,-13" stroke="#7A9A6A" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <path d="M0,0 Q0,-4 1,-11" stroke="#8AAA78" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <path d="M0,0 Q3,-7 3,-12" stroke="#7A9A6A" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
  </g>
)

// Bird — simple open-V silhouette
const Bird = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.55">
    <path d="M-6,0 Q-3,-3 0,0 Q3,-3 6,0" stroke="#5A6B55" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
  </g>
)

// Wildflower cluster — tiny dots in warm tones
const Wildflowers = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.8">
    <circle cx="0"  cy="0"  r="2.2" fill="#F2C94C"/>
    <circle cx="6"  cy="-3" r="1.8" fill="#F26B5A"/>
    <circle cx="-5" cy="-4" r="2"   fill="#E8A0D0"/>
    <circle cx="3"  cy="4"  r="1.6" fill="#F2C94C"/>
    <circle cx="-3" cy="3"  r="1.8" fill="#9ED6A8"/>
    <circle cx="8"  cy="2"  r="1.5" fill="#E8A0D0"/>
  </g>
)

const PIN_R = 18

const TreeIcon = ({ x, y, scale = 1, color = "#6B8E6F" }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-2.5" y="8" width="5" height="10" fill="#8B7355" rx="2"/>
    <circle cx="0" cy="3" r="9" fill={color} opacity="0.7"/>
    <circle cx="-4" cy="5" r="7" fill={color} opacity="0.6"/>
    <circle cx="4" cy="5" r="7" fill={color} opacity="0.6"/>
    <circle cx="0" cy="7" r="6" fill={color} opacity="0.8"/>
  </g>
)

// Cyclist — placed near the bottom road area
const Cyclist = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="-15" cy="5" r="9" fill="none" stroke="#5A4A3A" strokeWidth="1.8"/>
    <circle cx="15" cy="5" r="9" fill="none" stroke="#5A4A3A" strokeWidth="1.8"/>
    <line x1="-15" y1="-3" x2="-15" y2="13" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <line x1="-23" y1="5" x2="-7" y2="5" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <line x1="7" y1="5" x2="23" y2="5" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    <line x1="15" y1="-3" x2="15" y2="13" stroke="#5A4A3A" strokeWidth="0.8" opacity="0.5"/>
    {/* Bike frame */}
    <path d="M-15,5 L2,-4 L15,5" stroke="#D4845A" strokeWidth="2" fill="none"/>
    <line x1="2" y1="-4" x2="-2" y2="-15" stroke="#D4845A" strokeWidth="2"/>
    <line x1="15" y1="5" x2="9" y2="-4" stroke="#D4845A" strokeWidth="2"/>
    <line x1="-5" y1="-4" x2="9" y2="-4" stroke="#D4845A" strokeWidth="1.5"/>
    {/* Handlebar */}
    <path d="M9,-4 L13,-7 L15,-5" stroke="#5A4A3A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* Rider head */}
    <circle cx="-2" cy="-24" r="6" fill="#F5C5A3"/>
    {/* Hair */}
    <path d="M-6,-24 Q-11,-19 -9,-15" stroke="#4A3020" strokeWidth="1.5" fill="none"/>
    <path d="M2,-24 Q7,-19 5,-15" stroke="#4A3020" strokeWidth="1.5" fill="none"/>
    {/* Rider body leaning forward */}
    <path d="M-2,-18 C-2,-12 9,-6 9,-4" stroke="#5B7EC4" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* Leg on pedal */}
    <path d="M-2,-18 L-15,5" stroke="#4A6E9A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </g>
)

// Kid with arms up — splashing at the water park
const KidSplashing = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-18" r="6" fill="#F5C5A3"/>
    <line x1="0" y1="-12" x2="0" y2="2" stroke="#5B9ED6" strokeWidth="3" strokeLinecap="round"/>
    <path d="M0,-8 L-12,-17" stroke="#5B9ED6" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,-8 L12,-17" stroke="#5B9ED6" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Water drops from hands */}
    <circle cx="-13" cy="-19" r="1.5" fill="#5BB5F0" opacity="0.85"/>
    <circle cx="13" cy="-19" r="1.5" fill="#5BB5F0" opacity="0.85"/>
    <circle cx="-17" cy="-16" r="1" fill="#5BB5F0" opacity="0.6"/>
    <circle cx="17" cy="-16" r="1" fill="#5BB5F0" opacity="0.6"/>
    <path d="M0,2 L-10,14" stroke="#4A6E9A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,2 L10,14" stroke="#4A6E9A" strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="0" cy="17" rx="14" ry="3" fill="#5BB5F0" opacity="0.2"/>
  </g>
)

// Kid running — near Soccer Park
const KidRunning = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-18" r="5.5" fill="#F5C5A3"/>
    <path d="M0,-12 L0,2" stroke="#E8845A" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Arms mid-stride */}
    <path d="M0,-8 L-11,-2" stroke="#E8845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-8 L9,-14" stroke="#E8845A" strokeWidth="2" strokeLinecap="round"/>
    {/* Legs mid-stride */}
    <path d="M0,2 L-9,14" stroke="#7A6B5A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,2 L10,7" stroke="#7A6B5A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,7 L14,15" stroke="#7A6B5A" strokeWidth="2" strokeLinecap="round"/>
  </g>
)

// Dog walker — person + leash + dog
const DogWalker = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="-20" r="5.5" fill="#F5C5A3"/>
    <path d="M0,-14 L0,0" stroke="#C4845A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M0,-10 L10,-5" stroke="#C4845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,0 L-5,12" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,0 L5,12" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    {/* Leash */}
    <path d="M10,-5 Q18,2 22,5" stroke="#8B7355" strokeWidth="1" fill="none" strokeLinecap="round"/>
    {/* Dog body */}
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

// Picnic scene — two figures sitting on a blanket
const PicnicScene = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* Blanket */}
    <ellipse cx="0" cy="8" rx="22" ry="9" fill="#E8A87C" opacity="0.85"/>
    <line x1="-7" y1="2" x2="-5" y2="17" stroke="#D4755A" strokeWidth="1.5" opacity="0.45"/>
    <line x1="3" y1="1" x2="5" y2="17" stroke="#D4755A" strokeWidth="1.5" opacity="0.45"/>
    {/* Person 1 — leaning back */}
    <circle cx="-10" cy="-8" r="5.5" fill="#F5C5A3"/>
    <path d="M-10,-2 L-10,8" stroke="#5B7EC4" strokeWidth="3" strokeLinecap="round"/>
    <path d="M-10,2 L-18,3" stroke="#5B7EC4" strokeWidth="2" strokeLinecap="round"/>
    <path d="M-10,8 L-15,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M-10,8 L-5,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    {/* Person 2 — gesturing */}
    <circle cx="10" cy="-8" r="5.5" fill="#F5C5A3"/>
    <path d="M10,-2 L10,6" stroke="#E8845A" strokeWidth="3" strokeLinecap="round"/>
    <path d="M10,2 L18,0" stroke="#E8845A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,6 L5,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10,6 L15,15" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    {/* Basket + snacks */}
    <rect x="-2" y="4" width="7" height="6" rx="2" fill="#C4A882"/>
    <path d="M-2,4 Q1.5,1 5,4" stroke="#8B7355" strokeWidth="1.5" fill="none"/>
    <circle cx="15" cy="11" r="2" fill="#F2C94C" opacity="0.9"/>
    <circle cx="19" cy="9" r="1.5" fill="#F26B5A" opacity="0.9"/>
  </g>
)

// Pond — soft organic lake (Emerald Glen has a real lake)
const Pond = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`} opacity="0.78">
    <ellipse cx="0" cy="0" rx="34" ry="16" fill="#7EC8E3" filter="url(#watercolor)"/>
    <ellipse cx="0" cy="0" rx="32" ry="14" fill="#A8DDF2" opacity="0.5"/>
    <ellipse cx="-5" cy="-3" rx="14" ry="6" fill="#C8EEF9" opacity="0.4"/>
    <ellipse cx="8" cy="4" rx="8" ry="3.5" fill="none" stroke="#B8E4F2" strokeWidth="0.8" opacity="0.55"/>
  </g>
)

// House — simple side-view flat illustration
const House = ({ x, y, scale = 1, wallColor = "#E8D5B8", roofColor = "#C4845A" }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.87">
    <rect x="-12" y="0" width="24" height="17" rx="1.5" fill={wallColor} stroke="#B8A080" strokeWidth="0.7"/>
    <path d="M-14,0 L0,-14 L14,0 Z" fill={roofColor} stroke="#906040" strokeWidth="0.7"/>
    <rect x="-4" y="7" width="8" height="10" rx="1" fill="#8B6E50" opacity="0.72"/>
    <rect x="-11" y="3" width="7" height="5.5" rx="1" fill="#B8D8F0" opacity="0.8"/>
    <rect x="4" y="3" width="7" height="5.5" rx="1" fill="#B8D8F0" opacity="0.8"/>
  </g>
)

// Car — compact top-down view
const Car = ({ x, y, scale = 1, color = "#D4845A" }) => (
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

// Street lamp — small post + globe light
const StreetLamp = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-1.5" y="-1" width="3" height="3" rx="0.5" fill="#9A8070"/>
    <line x1="0" y1="-1" x2="0" y2="-20" stroke="#9A8070" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M0,-20 L4,-22" stroke="#9A8070" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <circle cx="4" cy="-23" r="2.8" fill="#F5E870" opacity="0.88"/>
    <circle cx="4" cy="-23" r="5" fill="#FFFAD0" opacity="0.2"/>
  </g>
)

// Bench — park bench side view
const Bench = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-10" y="-5" width="20" height="3" rx="1.5" fill="#B09070" opacity="0.88"/>
    <rect x="-10" y="-1" width="20" height="3.5" rx="1.5" fill="#C4A882" opacity="0.92"/>
    <line x1="-7" y1="2.5" x2="-7" y2="7" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="2.5" x2="7" y2="7" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round"/>
  </g>
)

// Bridge — wooden deck over Alamo Creek at Dublin Blvd crossing
const Bridge = ({ x, y }) => (
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

// Parent pushing stroller — near Baseball Park
const ParentStroller = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* Parent */}
    <circle cx="0" cy="-22" r="6" fill="#F5C5A3"/>
    <path d="M0,-16 L0,-2" stroke="#8B6E9E" strokeWidth="3" strokeLinecap="round"/>
    <path d="M0,-10 L-8,-5" stroke="#8B6E9E" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-10 L8,-2" stroke="#8B6E9E" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-2 L-6,10" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M0,-2 L6,10" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    {/* Stroller handle */}
    <path d="M8,-2 L18,4" stroke="#6B5A4A" strokeWidth="2" strokeLinecap="round"/>
    {/* Stroller body */}
    <path d="M18,4 L22,12 L10,12 Z" fill="#D4A0C0" opacity="0.9"/>
    {/* Stroller wheel */}
    <circle cx="22" cy="14" r="3" fill="none" stroke="#5A4A3A" strokeWidth="1.5"/>
    <circle cx="10" cy="14" r="3" fill="none" stroke="#5A4A3A" strokeWidth="1.5"/>
    {/* Baby head in stroller */}
    <circle cx="16" cy="9" r="3.5" fill="#F5C5A3"/>
  </g>
)

export default function DublinParksMap() {
  const [active, setActive] = useState(null)

  return (
    <div className="relative w-full rounded-2xl shadow-2xl" style={{ aspectRatio: '800/520' }}>
      {/* SVG layer — clipped to rounded corners */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
      <svg viewBox="0 0 800 520" className="w-full h-full">
        <defs>
          {/* Watercolor texture for background/parks */}
          <filter id="watercolor">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8"/>
          </filter>

          {/* Soft shadow */}
          <filter id="softShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Pin drop shadow */}
          <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.22"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Hand-drawn road wobble — low scale keeps it subtle */}
          <filter id="handDrawn" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="5" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
          </filter>

          <pattern id="grassNoise" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#A8B89A"/>
            <circle cx="3" cy="2.5" r="0.5" fill="#B8C9A8"/>
          </pattern>

          <radialGradient id="vignette" cx="50%" cy="50%">
            <stop offset="40%" stopColor="transparent"/>
            <stop offset="100%" stopColor="#A8B89A" stopOpacity="0.2"/>
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="800" height="520" fill="#C8D5B9"/>
        <rect width="800" height="520" fill="url(#grassNoise)" opacity="0.2"/>
        <rect width="800" height="520" fill="url(#vignette)"/>

        {/* Dublin Hills */}
        <path
          d="M0,0 L800,0 L800,95 Q680,55 540,82 Q400,38 260,78 Q130,48 0,88 Z"
          fill="#A8B89A"
          opacity="0.6"
          filter="url(#watercolor)"
        />
        <path
          d="M0,0 L800,0 L800,88 Q685,52 545,78 Q405,38 265,74 Q135,46 0,84 Z"
          fill="#B8C9AA"
          opacity="0.3"
        />
        <text x="615" y="52" fontSize="14" fill="#5A7355" fontFamily="'Fredoka', cursive" fontWeight="600" opacity="0.85">
          Dublin Hills
        </text>

        {/* Alamo Creek — runs north-south just west of Dougherty Rd */}
        <g opacity="0.7">
          {/* Creek body — soft wavy fill */}
          <path
            d="M 100 88 C 97 140 104 190 99 240 C 95 290 102 330 98 380 C 95 415 100 440 97 470"
            stroke="#7EC8E3"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            filter="url(#handDrawn)"
          />
          {/* Lighter highlight on the creek */}
          <path
            d="M 101 88 C 98 140 105 190 100 240 C 96 290 103 330 99 380 C 96 415 101 440 98 470"
            stroke="#B8E4F2"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
            filter="url(#handDrawn)"
          />
        </g>
        <text x="80" y="320" fontSize="7.5" fill="#5A9AB5" fontFamily="'Patrick Hand', cursive"
          transform="rotate(-90, 80, 320)" opacity="0.7">
          Alamo Creek
        </text>

        {/* Pond — Emerald Glen lake near Splash Park */}
        <Pond x={548} y={238}/>

        {/* Grass tufts — open areas and road edges */}
        <GrassTuft x={230} y={165} scale={1.1}/>
        <GrassTuft x={300} y={248} scale={0.9}/>
        <GrassTuft x={390} y={175} scale={1.0}/>
        <GrassTuft x={460} y={145} scale={0.85}/>
        <GrassTuft x={570} y={155} scale={1.0}/>
        <GrassTuft x={680} y={135} scale={0.9}/>
        <GrassTuft x={370} y={330} scale={0.9}/>
        <GrassTuft x={480} y={345} scale={1.0}/>
        <GrassTuft x={620} y={310} scale={0.85}/>
        <GrassTuft x={700} y={248} scale={1.0}/>
        <GrassTuft x={250} y={415} scale={0.9}/>
        <GrassTuft x={560} y={470} scale={1.0}/>
        <GrassTuft x={720} y={420} scale={0.85}/>
        <GrassTuft x={148} y={302} scale={0.9}/>
        <GrassTuft x={420} y={468} scale={1.0}/>

        {/* Birds — over the Dublin Hills */}
        <Bird x={320} y={38} scale={1.1}/>
        <Bird x={334} y={32} scale={0.9}/>
        <Bird x={348} y={40} scale={1.0}/>
        <Bird x={500} y={30} scale={1.0}/>
        <Bird x={516} y={24} scale={0.85}/>
        <Bird x={420} y={18} scale={0.9}/>
        <Bird x={435} y={26} scale={1.1}/>

        {/* Wildflowers — near hills edge and road margins */}
        <Wildflowers x={195} y={95}  scale={0.9}/>
        <Wildflowers x={310} y={100} scale={0.8}/>
        <Wildflowers x={440} y={108} scale={0.85}/>
        <Wildflowers x={580} y={92}  scale={0.9}/>
        <Wildflowers x={148} y={475} scale={0.8}/>
        <Wildflowers x={640} y={455} scale={0.85}/>
        <Wildflowers x={755} y={465} scale={0.75}/>

        {/* Roads — paths with hand-drawn filter applied */}
        <g filter="url(#handDrawn)">
          {/* I-580 freeway */}
          <path
            d="M 0 452 Q 120 449 260 453 Q 420 456 580 452 Q 700 449 800 452"
            stroke="#FFFFFF" strokeWidth="14" fill="none" strokeLinecap="round"
          />
          {/* Dublin Blvd */}
          <path
            d="M 25 362 Q 180 360 340 364 Q 520 367 700 362 L 790 362"
            stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round"
          />
          {/* Central Pkwy */}
          <path
            d="M 200 287 Q 360 285 480 289 Q 620 291 790 287"
            stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round"
          />
          {/* Dougherty Rd — vertical with S-curve */}
          <path
            d="M 124 88 C 121 180 127 270 123 363 C 120 410 124 435 122 460"
            stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round"
          />
          {/* Tassajara Rd — vertical with wobble */}
          <path
            d="M 521 55 C 518 130 524 220 520 290 C 517 345 521 370 519 400"
            stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round"
          />
          {/* Fallon Rd — vertical */}
          <path
            d="M 749 88 C 746 160 752 240 748 312 C 745 360 749 382 747 400"
            stroke="#FFFFFF" strokeWidth="4.5" fill="none" strokeLinecap="round"
          />
          {/* Center dashes — Dublin Blvd */}
          <path
            d="M 25 362 Q 180 360 340 364 Q 520 367 700 362 L 790 362"
            stroke="#F0D878" strokeWidth="1.2" fill="none"
            strokeLinecap="round" strokeDasharray="10 14" opacity="0.5"
          />
          {/* Center dashes — Central Pkwy */}
          <path
            d="M 200 287 Q 360 285 480 289 Q 620 291 790 287"
            stroke="#F0D878" strokeWidth="1" fill="none"
            strokeLinecap="round" strokeDasharray="8 12" opacity="0.42"
          />
        </g>

        {/* Bridge over Alamo Creek at Dublin Blvd crossing */}
        <Bridge x={99} y={362}/>

        {/* Road labels — outside filter so text stays crisp */}
        <text x="710" y="457" fontSize="11" fill="#6A7A65" fontFamily="'Patrick Hand', cursive" fontWeight="bold">I-580</text>
        <text x="240" y="354" fontSize="10" fill="#7A8A75" fontFamily="'Patrick Hand', cursive">Dublin Blvd</text>
        <text x="350" y="280" fontSize="9" fill="#8A9A85" fontFamily="'Patrick Hand', cursive">Central Pkwy</text>
        <text x="528" y="382" fontSize="9" fill="#8A9A85" fontFamily="'Patrick Hand', cursive">Tassajara Rd</text>
        <text x="756" y="220" fontSize="9" fill="#8A9A85" fontFamily="'Patrick Hand', cursive">Fallon Rd</text>

        {/* Decorative trees */}
        <TreeIcon x="170" y="148" scale="0.9" color="#6B8E6F"/>
        <TreeIcon x="345" y="118" scale="1.1" color="#7A9E7F"/>
        <TreeIcon x="275" y="198" scale="0.75" color="#6B8E6F"/>
        <TreeIcon x="650" y="178" scale="1.0" color="#7A9E7F"/>
        <TreeIcon x="415" y="378" scale="0.85" color="#6B8E6F"/>
        <TreeIcon x="558" y="418" scale="0.95" color="#7A9E7F"/>
        <TreeIcon x="198" y="338" scale="0.9" color="#6B8E6F"/>
        <TreeIcon x="678" y="378" scale="1.05" color="#7A9E7F"/>
        <TreeIcon x="455" y="218" scale="0.7" color="#6B8E6F"/>
        <TreeIcon x="605" y="248" scale="0.85" color="#7A9E7F"/>

        {/* Houses — scattered neighborhood blocks */}
        <House x={230} y={158} wallColor="#E8D5B8" roofColor="#C4845A"/>
        <House x={585} y={195} wallColor="#D8D4E8" roofColor="#8870A8"/>
        <House x={282} y={318} wallColor="#D0E4E8" roofColor="#5880A0"/>
        <House x={635} y={328} wallColor="#E0E8D8" roofColor="#789060"/>

        {/* Cars — top-down on Dublin Blvd and Central Pkwy */}
        <Car x={475} y={362} scale={0.75} color="#E8754A"/>
        <Car x={310} y={287} scale={0.65} color="#5B8AAE"/>

        {/* Benches — near Splash Park, Baseball Park, Red Park */}
        <Bench x={515} y={315}/>
        <Bench x={145} y={432}/>
        <Bench x={88} y={200}/>

        {/* Characters */}
        {/* Cyclist cruising near Dublin Blvd */}
        <Cyclist x={320} y={422} scale={0.85}/>
        {/* Kid splashing near Splash Park */}
        <KidSplashing x={446} y={258} scale={0.82}/>
        {/* Kid running at Soccer Park */}
        <KidRunning x={695} y={292} scale={0.8}/>
        {/* Parent with stroller near Baseball Park */}
        <ParentStroller x={155} y={402} scale={0.78}/>
        {/* Dog walker between Central Pkwy and Dublin Blvd */}
        <DogWalker x={358} y={318} scale={0.78}/>
        {/* Picnic scene near Baseball Park */}
        <PicnicScene x={192} y={443} scale={0.76}/>

        {/* Parks — compact badge pins */}
        {PARKS.map((park) => {
          const isHovered = active?.id === park.id

          return (
            <g
              key={park.id}
              onMouseEnter={() => setActive(park)}
              onMouseLeave={() => setActive(null)}
              style={{
                cursor: 'pointer',
                transformOrigin: `${park.x}px ${park.y}px`,
                transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Soft halo — only on hover, same size as pin */}
              <circle
                cx={park.x} cy={park.y}
                r={PIN_R + 7}
                fill={park.bgColor}
                opacity={isHovered ? 0.45 : 0}
                style={{ transition: 'opacity 0.2s ease' }}
              />

              {/* Badge circle */}
              <circle
                cx={park.x} cy={park.y}
                r={PIN_R}
                fill={park.bgColor}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                filter="url(#pinShadow)"
              />

              {/* Emoji */}
              <text
                x={park.x}
                y={park.y + 6}
                textAnchor="middle"
                fontSize="16"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {park.icon}
              </text>

              {/* Kid name */}
              <text
                x={park.x}
                y={park.y + PIN_R + 13}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={park.color}
                fontFamily="'Fredoka', cursive"
                style={{ filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.95))' }}
              >
                {park.kidName}
              </text>
            </g>
          )
        })}

        {/* Compass Rose */}
        <g transform="translate(745, 45)">
          <circle cx="0" cy="0" r="28" fill="#FFFFFF" opacity="0.95" filter="url(#softShadow)"/>
          <circle cx="0" cy="0" r="26" fill="none" stroke="#C19A6B" strokeWidth="2" opacity="0.3"/>
          <circle cx="0" cy="0" r="22" fill="none" stroke="#C19A6B" strokeWidth="1.5" opacity="0.25"/>
          <path d="M0,-18 L3,-6 L0,-8 L-3,-6 Z" fill="#E74C3C" stroke="#C0392B" strokeWidth="1"/>
          <path d="M0,18 L3,6 L0,8 L-3,6 Z" fill="#A8B89A" opacity="0.5"/>
          <text x="0" y="-26" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#2C3E50" fontFamily="'Fredoka', cursive">N</text>
          <text x="24" y="4" textAnchor="middle" fontSize="9" fill="#7F8C8D" fontFamily="'Fredoka', cursive">E</text>
          <text x="0" y="28" textAnchor="middle" fontSize="9" fill="#7F8C8D" fontFamily="'Fredoka', cursive">S</text>
          <text x="-24" y="4" textAnchor="middle" fontSize="9" fill="#7F8C8D" fontFamily="'Fredoka', cursive">W</text>
        </g>

      </svg>
      </div>

      {/* Floating tooltip — not clipped by inner overflow-hidden */}
      {active && (
        <div
          style={{
            ...getTooltipStyle(active),
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,248,231,0.98) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: `2.5px solid ${active.color}`,
            borderRadius: '16px',
            animation: 'tooltipAppear 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{active.icon}</span>
              <h3 className="text-base font-black leading-tight"
                style={{ fontFamily: "'Fredoka', cursive", color: active.color }}>
                {active.kidName}
              </h3>
            </div>
            <p className="text-xs uppercase tracking-widest font-bold mb-1.5"
              style={{ color: '#95A5A6', fontFamily: "'Fredoka', cursive" }}>
              {active.officialName}
            </p>
            <p className="leading-relaxed"
              style={{ color: '#34495E', fontFamily: "'Patrick Hand', cursive", fontSize: '13px' }}>
              {active.note}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Patrick+Hand&display=swap');

        @keyframes tooltipAppear {
          0%   { opacity: 0; scale: 0.92; }
          100% { opacity: 1; scale: 1; }
        }
      `}</style>
    </div>
  )
}
