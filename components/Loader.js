import { useEffect, useState } from 'react'

export default function Loader() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10)
        return newProgress > 100 ? 100 : newProgress
      })
    }, 150)

    // Hide loader after animation completes
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500" 
         style={{ opacity: progress === 100 ? '0' : '1' }}>
      <div className="mb-8 text-4xl font-bold">
        <span className="text-primary">Your</span>
        <span className="text-accent">Name</span>
      </div>
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
        <div 
          className="absolute top-0 left-0 w-16 h-16 border-4 border-t-primary border-r-primary border-transparent rounded-full animate-spin"
        ></div>
      </div>
      <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Loading...
      </div>
    </div>
  )
} 