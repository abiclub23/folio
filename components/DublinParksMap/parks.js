export function getTooltipStyle(park) {
  const flipX = park.x > 400
  const flipY = park.y > 346
  const PIN_GAP = 28

  return {
    position: 'absolute',
    left: `${(park.x / 800) * 100}%`,
    top: `${(park.y / 520) * 100}%`,
    transform: [
      flipX ? 'translateX(-100%)' : 'translateX(0)',
      flipY ? `translateY(calc(-100% - ${PIN_GAP}px))` : `translateY(${PIN_GAP}px)`,
    ].join(' '),
    width: '210px',
    pointerEvents: 'none',
    zIndex: 20,
  }
}

export const PARKS = [
  {
    id: 1,
    kidName: "Splash Park",
    officialName: "Emerald Glen Park",
    note: "The one with the water jets. A summer essential, but also great year round. It also hosts farmer's market in the fall and has wave water park in the summer.",
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
    note: "Cross it to and fro from school. It has a nice playground, filled with classmates.",
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
    note: "Deep in Jordan Ranch. Log bridges, rope climbs. Rolling hills views.",
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
