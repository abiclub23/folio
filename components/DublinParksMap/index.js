import { useState } from 'react'
import { PARKS, getTooltipStyle } from './parks'
import {
  PIN_R, GrassTuft, Bird, Wildflowers, TreeIcon,
  Pond, House, Car, Bench, Bridge,
} from './decorations'
import {
  Cyclist, KidSplashing, KidRunning,
  DogWalker, PicnicScene, ParentStroller,
} from './characters'

export default function DublinParksMap() {
  const [active, setActive] = useState(null)

  return (
    <div className="relative w-full rounded-2xl shadow-2xl" style={{ aspectRatio: '800/520' }} onClick={() => setActive(null)}>
      {/* SVG layer — clipped to rounded corners */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <svg viewBox="0 0 800 520" className="w-full h-full">
          <defs>
            <filter id="watercolor">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="8"/>
            </filter>
            <filter id="softShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer><feFuncA type="linear" slope="0.22"/></feComponentTransfer>
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
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
          <path d="M0,0 L800,0 L800,95 Q680,55 540,82 Q400,38 260,78 Q130,48 0,88 Z"
            fill="#A8B89A" opacity="0.6" filter="url(#watercolor)"/>
          <path d="M0,0 L800,0 L800,88 Q685,52 545,78 Q405,38 265,74 Q135,46 0,84 Z"
            fill="#B8C9AA" opacity="0.3"/>
          <text x="615" y="52" fontSize="14" fill="#5A7355" fontFamily="'Fredoka', cursive" fontWeight="600" opacity="0.85">
            Dublin Hills
          </text>

          {/* Alamo Creek */}
          <g opacity="0.7">
            <path d="M 100 88 C 97 140 104 190 99 240 C 95 290 102 330 98 380 C 95 415 100 440 97 470"
              stroke="#7EC8E3" strokeWidth="5" fill="none" strokeLinecap="round" filter="url(#handDrawn)"/>
            <path d="M 101 88 C 98 140 105 190 100 240 C 96 290 103 330 99 380 C 96 415 101 440 98 470"
              stroke="#B8E4F2" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" filter="url(#handDrawn)"/>
          </g>
          <text x="80" y="320" fontSize="7.5" fill="#5A9AB5" fontFamily="'Patrick Hand', cursive"
            transform="rotate(-90, 80, 320)" opacity="0.7">Alamo Creek</text>

          <Pond x={548} y={238}/>

          {/* Grass tufts */}
          <GrassTuft x={230} y={165} scale={1.1}/> <GrassTuft x={300} y={248} scale={0.9}/>
          <GrassTuft x={390} y={175} scale={1.0}/> <GrassTuft x={460} y={145} scale={0.85}/>
          <GrassTuft x={570} y={155} scale={1.0}/> <GrassTuft x={680} y={135} scale={0.9}/>
          <GrassTuft x={370} y={330} scale={0.9}/> <GrassTuft x={480} y={345} scale={1.0}/>
          <GrassTuft x={620} y={310} scale={0.85}/><GrassTuft x={700} y={248} scale={1.0}/>
          <GrassTuft x={250} y={415} scale={0.9}/> <GrassTuft x={560} y={470} scale={1.0}/>
          <GrassTuft x={720} y={420} scale={0.85}/><GrassTuft x={148} y={302} scale={0.9}/>
          <GrassTuft x={420} y={468} scale={1.0}/>

          {/* Birds */}
          <Bird x={320} y={38} scale={1.1}/> <Bird x={334} y={32} scale={0.9}/>
          <Bird x={348} y={40} scale={1.0}/> <Bird x={500} y={30} scale={1.0}/>
          <Bird x={516} y={24} scale={0.85}/><Bird x={420} y={18} scale={0.9}/>
          <Bird x={435} y={26} scale={1.1}/>

          {/* Wildflowers */}
          <Wildflowers x={195} y={95}  scale={0.9}/> <Wildflowers x={310} y={100} scale={0.8}/>
          <Wildflowers x={440} y={108} scale={0.85}/><Wildflowers x={580} y={92}  scale={0.9}/>
          <Wildflowers x={148} y={475} scale={0.8}/> <Wildflowers x={640} y={455} scale={0.85}/>
          <Wildflowers x={755} y={465} scale={0.75}/>

          {/* Roads */}
          <g filter="url(#handDrawn)">
            <path d="M 0 452 Q 120 449 260 453 Q 420 456 580 452 Q 700 449 800 452"
              stroke="#FFFFFF" strokeWidth="14" fill="none" strokeLinecap="round"/>
            <path d="M 25 362 Q 180 360 340 364 Q 520 367 700 362 L 790 362"
              stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <path d="M 200 287 Q 360 285 480 289 Q 620 291 790 287"
              stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M 124 88 C 121 180 127 270 123 363 C 120 410 124 435 122 460"
              stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M 521 55 C 518 130 524 220 520 290 C 517 345 521 370 519 400"
              stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M 749 88 C 746 160 752 240 748 312 C 745 360 749 382 747 400"
              stroke="#FFFFFF" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
            <path d="M 25 362 Q 180 360 340 364 Q 520 367 700 362 L 790 362"
              stroke="#F0D878" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="10 14" opacity="0.5"/>
            <path d="M 200 287 Q 360 285 480 289 Q 620 291 790 287"
              stroke="#F0D878" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="8 12" opacity="0.42"/>
          </g>

          <Bridge x={99} y={362}/>

          {/* Road labels */}
          <text x="710" y="457" fontSize="11" fill="#6A7A65" fontFamily="'Patrick Hand', cursive" fontWeight="bold">I-580</text>
          <text x="240" y="354" fontSize="10" fill="#7A8A75" fontFamily="'Patrick Hand', cursive">Dublin Blvd</text>
          <text x="350" y="280" fontSize="9"  fill="#8A9A85" fontFamily="'Patrick Hand', cursive">Central Pkwy</text>
          <text x="528" y="382" fontSize="9"  fill="#8A9A85" fontFamily="'Patrick Hand', cursive">Tassajara Rd</text>
          <text x="756" y="220" fontSize="9"  fill="#8A9A85" fontFamily="'Patrick Hand', cursive">Fallon Rd</text>

          {/* Trees */}
          <TreeIcon x="170" y="148" scale="0.9"  color="#6B8E6F"/>
          <TreeIcon x="345" y="118" scale="1.1"  color="#7A9E7F"/>
          <TreeIcon x="275" y="198" scale="0.75" color="#6B8E6F"/>
          <TreeIcon x="650" y="178" scale="1.0"  color="#7A9E7F"/>
          <TreeIcon x="415" y="378" scale="0.85" color="#6B8E6F"/>
          <TreeIcon x="558" y="418" scale="0.95" color="#7A9E7F"/>
          <TreeIcon x="198" y="338" scale="0.9"  color="#6B8E6F"/>
          <TreeIcon x="678" y="378" scale="1.05" color="#7A9E7F"/>
          <TreeIcon x="455" y="218" scale="0.7"  color="#6B8E6F"/>
          <TreeIcon x="605" y="248" scale="0.85" color="#7A9E7F"/>

          {/* Houses */}
          <House x={230} y={158} wallColor="#E8D5B8" roofColor="#C4845A"/>
          <House x={585} y={195} wallColor="#D8D4E8" roofColor="#8870A8"/>
          <House x={282} y={318} wallColor="#D0E4E8" roofColor="#5880A0"/>
          <House x={635} y={328} wallColor="#E0E8D8" roofColor="#789060"/>

          {/* Cars */}
          <Car x={475} y={362} scale={0.75} color="#E8754A"/>
          <Car x={310} y={287} scale={0.65} color="#5B8AAE"/>

          {/* Benches */}
          <Bench x={515} y={315}/>
          <Bench x={145} y={432}/>
          <Bench x={88}  y={200}/>

          {/* Characters */}
          <Cyclist       x={320} y={422} scale={0.85}/>
          <KidSplashing  x={446} y={258} scale={0.82}/>
          <KidRunning    x={695} y={292} scale={0.8}/>
          <ParentStroller x={155} y={402} scale={0.78}/>
          <DogWalker     x={358} y={318} scale={0.78}/>
          <PicnicScene   x={192} y={443} scale={0.76}/>

          {/* Park pins */}
          {PARKS.map((park) => {
            const isHovered = active?.id === park.id
            return (
              <g key={park.id}
                onMouseEnter={() => setActive(park)}
                onMouseLeave={() => setActive(null)}
                onClick={(e) => { e.stopPropagation(); setActive(active?.id === park.id ? null : park) }}
                style={{
                  cursor: 'pointer',
                  transformOrigin: `${park.x}px ${park.y}px`,
                  transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <circle cx={park.x} cy={park.y} r={PIN_R + 7} fill={park.bgColor}
                  opacity={isHovered ? 0.45 : 0} style={{ transition: 'opacity 0.2s ease' }}/>
                <circle cx={park.x} cy={park.y} r={PIN_R} fill={park.bgColor}
                  stroke="#FFFFFF" strokeWidth="2.5" filter="url(#pinShadow)"/>
                <text x={park.x} y={park.y + 6} textAnchor="middle" fontSize="16"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>{park.icon}</text>
                <text x={park.x} y={park.y + PIN_R + 13} textAnchor="middle"
                  fontSize="10" fontWeight="700" fill={park.color} fontFamily="'Fredoka', cursive"
                  style={{ filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.95))' }}>
                  {park.kidName}
                </text>
              </g>
            )
          })}

          {/* Compass rose */}
          <g transform="translate(745, 45)">
            <circle cx="0" cy="0" r="28" fill="#FFFFFF" opacity="0.95" filter="url(#softShadow)"/>
            <circle cx="0" cy="0" r="26" fill="none" stroke="#C19A6B" strokeWidth="2" opacity="0.3"/>
            <circle cx="0" cy="0" r="22" fill="none" stroke="#C19A6B" strokeWidth="1.5" opacity="0.25"/>
            <path d="M0,-18 L3,-6 L0,-8 L-3,-6 Z" fill="#E74C3C" stroke="#C0392B" strokeWidth="1"/>
            <path d="M0,18 L3,6 L0,8 L-3,6 Z" fill="#A8B89A" opacity="0.5"/>
            <text x="0"   y="-26" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#2C3E50" fontFamily="'Fredoka', cursive">N</text>
            <text x="24"  y="4"   textAnchor="middle" fontSize="9"  fill="#7F8C8D" fontFamily="'Fredoka', cursive">E</text>
            <text x="0"   y="28"  textAnchor="middle" fontSize="9"  fill="#7F8C8D" fontFamily="'Fredoka', cursive">S</text>
            <text x="-24" y="4"   textAnchor="middle" fontSize="9"  fill="#7F8C8D" fontFamily="'Fredoka', cursive">W</text>
          </g>
        </svg>
      </div>

      {/* Floating tooltip */}
      {active && (
        <div style={{
          ...getTooltipStyle(active),
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,248,231,0.98) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: `2.5px solid ${active.color}`,
          borderRadius: '16px',
          animation: 'tooltipAppear 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
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
