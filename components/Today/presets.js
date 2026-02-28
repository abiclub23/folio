export function getMoodStyles(mood) {
  const presets = {
    calm: {
      container: 'flex items-center justify-center',
      headlineSize: 'text-6xl',
      headlineWeight: 'font-light',
      transform: '',
      subSize: 'text-xl',
      linkSize: 'text-4xl font-light',
      linkEffect: 'hover:opacity-70',
      speed: '500'
    },
    weird: {
      container: '',
      headlineSize: 'text-7xl',
      headlineWeight: 'font-normal',
      transform: 'rotate-[-2deg]',
      subSize: 'text-lg',
      linkSize: 'text-5xl font-normal',
      linkEffect: 'inline-block hover:rotate-[3deg] hover:scale-105',
      speed: '300'
    },
    bold: {
      container: '',
      headlineSize: 'text-8xl md:text-9xl',
      headlineWeight: 'font-bold',
      transform: 'uppercase',
      subSize: 'text-2xl',
      linkSize: 'text-6xl font-bold',
      linkEffect: 'hover:scale-110 hover:drop-shadow-lg',
      speed: '200'
    }
  }
  return presets[mood] || presets.calm
}

export function getLayoutStyles(layout) {
  const presets = {
    center: {
      wrapper: 'max-w-4xl mx-auto text-center',
      nav: 'flex flex-col items-center space-y-6'
    },
    split: {
      wrapper: 'max-w-6xl mx-auto',
      nav: 'grid grid-cols-2 gap-8'
    }
  }
  return presets[layout] || presets.center
}

export function getAccentStyles(accent) {
  const presets = {
    mono: {
      bg: 'bg-gray-50',
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
      link: 'text-gray-700',
      hover: 'hover:text-gray-900 hover:underline',
      color: '#6b7280' // for Three.js
    },
    blue: {
      bg: 'bg-[#f5f7fa]',
      primary: 'text-gray-900',
      secondary: 'text-[#7494de]',
      tertiary: 'text-gray-500',
      link: 'text-gray-800',
      hover: 'hover:text-[#7494de]',
      color: '#7494de'
    },
    green: {
      bg: 'bg-[#f5ecd9]',
      primary: 'text-gray-900',
      secondary: 'text-[#688a74]',
      tertiary: 'text-gray-500',
      link: 'text-gray-800',
      hover: 'hover:text-[#197B58]',
      color: '#688a74'
    }
  }
  return presets[accent] || presets.mono
}

export function getNavigationStyles(navConfig) {
  const { style, position } = navConfig

  const stylePresets = {
    floating: {
      wrapper: 'fixed backdrop-blur-sm bg-white/30 px-6 py-3 rounded-full shadow-lg',
      links: 'flex space-x-6 text-sm',
      linkClass: 'hover:opacity-70 transition-opacity'
    },
    minimal: {
      wrapper: 'absolute px-8 py-4',
      links: 'flex space-x-8 text-sm',
      linkClass: 'hover:underline'
    },
    hidden: {
      wrapper: 'hidden',
      links: '',
      linkClass: ''
    },
    traditional: {
      wrapper: 'w-full border-b px-8 py-4',
      links: 'flex space-x-8',
      linkClass: 'hover:opacity-70 transition-opacity'
    }
  }

  const positionPresets = {
    top: 'top-8 left-1/2 -translate-x-1/2',
    bottom: 'bottom-8 left-1/2 -translate-x-1/2',
    side: 'top-1/2 right-8 -translate-y-1/2'
  }

  const stylePreset = stylePresets[style] || stylePresets.floating
  const positionClass = positionPresets[position] || positionPresets.top

  return {
    ...stylePreset,
    position: positionClass
  }
}
